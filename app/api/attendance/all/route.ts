// app/api/attendance/all/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
// @ts-ignore
import DigestFetch from "digest-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ================= HIKVISION CONFIG =================
//
// .env.local:
// HIKVISION_IP=192.168.1.113
// HIKVISION_USERNAME=admin
// HIKVISION_PASSWORD=Lemonpay@321
// HIKVISION_START_TIME=2025-11-03T00:00:00+05:30
// ====================================================
const HIK_CONFIG = {
  ip: process.env.HIKVISION_IP || "192.168.1.113",
  username: process.env.HIKVISION_USERNAME || "admin",
  password: process.env.HIKVISION_PASSWORD || "password",
  startTime:
    process.env.HIKVISION_START_TIME || "2025-11-03T00:00:00+05:30",
};

// Helper: current time in IST without ms, with +05:30
function getCurrentTimeIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace("Z", "").slice(0, 19) + "+05:30";
}

// Extract YYYY-MM-DD from any date string
function extractDateKey(value: string | Date | undefined | null): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (value.length === 10 && !value.includes("T")) {
      return value; // already YYYY-MM-DD
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// ---------- Types ----------
interface HikvisionLog {
  time: string;
  minor: number;
  employeeNoString?: string;
  employeeNo?: string;
  name?: string;
  cardNo?: string;
}

type AttendanceModeType =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecordOut {
  _id: string;
  employeeId: string;
  employeeName?: string | null;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceModeType;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

// ---------- HIKVISION FETCH ----------
async function fetchHikvisionLogs(): Promise<HikvisionLog[]> {
  console.log("HIKVISION CONFIG", {
    ip: HIK_CONFIG.ip,
    username: HIK_CONFIG.username,
    hasPassword: !!HIK_CONFIG.password,
  });

  const client = new DigestFetch(HIK_CONFIG.username, HIK_CONFIG.password);
  const url = `http://${HIK_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

  const endTimeSafe = getCurrentTimeIST();

  let allLogs: HikvisionLog[] = [];
  let searchPosition = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: searchPosition,
        maxResults: 30,
        major: 0,
        minor: 0,
        startTime: HIK_CONFIG.startTime,
        endTime: endTimeSafe,
      },
    };

    const response = await client.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Hikvision Error: ${response.status} - ${response.statusText}`
      );
      break;
    }

    const data = await response.json();

    const infoList: any[] =
      data?.AcsEvent?.InfoList && Array.isArray(data.AcsEvent.InfoList)
        ? data.AcsEvent.InfoList
        : [];

    if (!infoList.length) {
      hasMoreData = false;
      break;
    }

    const batchLogs: HikvisionLog[] = infoList.map((log: any) => ({
      time: log.time,
      minor: log.minor,
      employeeNoString: log.employeeNoString,
      employeeNo: log.employeeNo,
      name: log.name,
      cardNo: log.cardNo,
    }));

    allLogs = allLogs.concat(batchLogs);
    searchPosition += batchLogs.length;

    if (batchLogs.length < 30) {
      hasMoreData = false;
    }
  }

  console.log("Hikvision raw logs count:", allLogs.length);

  return allLogs.reverse(); // newest first
}

// Convert Hikvision raw logs -> daily IN/OFFICE records for TODAY only
function buildHikvisionAttendanceForToday(
  logs: HikvisionLog[]
): AttendanceRecordOut[] {
  const todayIST = getCurrentTimeIST().slice(0, 10); // "YYYY-MM-DD"

  const groups = new Map<
    string,
    {
      employeeId: string;
      employeeName?: string;
      date: string;
      firstTime: string;
      lastTime: string;
    }
  >();

  for (const log of logs) {
    const dateKey = log.time.slice(0, 10); // assumes device time has same pattern
    if (dateKey !== todayIST) continue; // only today

    const empId =
      log.employeeNoString ||
      log.employeeNo ||
      log.cardNo ||
      log.name ||
      "UNKNOWN";

    const key = empId; // date is same (today) for all kept logs

    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, {
        employeeId: empId,
        employeeName: log.name || "",
        date: dateKey,
        firstTime: log.time,
        lastTime: log.time,
      });
    } else {
      const currentTime = new Date(log.time).getTime();
      const firstTime = new Date(existing.firstTime).getTime();
      const lastTime = new Date(existing.lastTime).getTime();

      if (currentTime < firstTime) {
        existing.firstTime = log.time;
      }
      if (currentTime > lastTime) {
        existing.lastTime = log.time;
      }

      if (!existing.employeeName && log.name) {
        existing.employeeName = log.name;
      }
    }
  }

  const records: AttendanceRecordOut[] = [];

  for (const group of groups.values()) {
    const { employeeId, employeeName, date, firstTime, lastTime } = group;

    records.push({
      _id: `hik-${employeeId}-${date}`,
      employeeId,
      employeeName: employeeName || null,
      date,
      punchInTime: firstTime,
      punchOutTime: lastTime,
      mode: "IN_OFFICE",
      punchInLatitude: null,
      punchInLongitude: null,
      punchOutLatitude: null,
      punchOutLongitude: null,
    });
  }

  console.log("Hikvision TODAY grouped records count:", records.length);

  records.sort((a, b) => {
    if (a.date === b.date) {
      return (a.employeeName || "").localeCompare(b.employeeName || "");
    }
    return a.date < b.date ? 1 : -1;
  });

  return records;
}

// ---------- MAIN GET HANDLER: DB (ALL DATES) + HIKVISION (TODAY) ----------
export async function GET() {
  try {
    await connectDB();

    const todayIST = getCurrentTimeIST().slice(0, 10);

    // 1) MongoDB attendance – ALL records
    const dbRecords = await Attendance.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const employeeIds = Array.from(
      new Set(dbRecords.map((r: any) => r.employeeId))
    );

    const employees = await Employee.find({
      empId: { $in: employeeIds },
    })
      .select("empId name")
      .lean();

    const nameMap = new Map<string, string>();
    employees.forEach((emp: any) => {
      const key = emp.empId || emp.employeeId;
      if (key && emp.name) {
        nameMap.set(key, emp.name);
      }
    });

    // 🔹 No "today only" filter here – we keep ALL DB records
    const dbRecordsWithNames: AttendanceRecordOut[] = dbRecords.map(
      (r: any) => ({
        _id: r._id.toString(),
        employeeId: r.employeeId,
        employeeName: nameMap.get(r.employeeId) || null,
        // normalize date to "YYYY-MM-DD"
        date: extractDateKey(r.date),
        punchInTime: r.punchInTime || null,
        punchOutTime: r.punchOutTime || null,
        mode: (r.mode as AttendanceModeType) || "IN_OFFICE",
        punchInLatitude: r.punchInLatitude ?? null,
        punchInLongitude: r.punchInLongitude ?? null,
        punchOutLatitude: r.punchOutLatitude ?? null,
        punchOutLongitude: r.punchOutLongitude ?? null,
      })
    );

    console.log("DB records count:", dbRecordsWithNames.length);

    // 2) Hikvision attendance (device) – TODAY
    let hikvisionRecords: AttendanceRecordOut[] = [];
    try {
      const logs = await fetchHikvisionLogs();
      hikvisionRecords = buildHikvisionAttendanceForToday(logs);
    } catch (e) {
      console.error("Failed to fetch Hikvision logs:", e);
    }

    console.log("Hikvision TODAY records count:", hikvisionRecords.length);

    // 3) Merge DB (all dates) + Hikvision (today)
    const allRecords: AttendanceRecordOut[] = [
      ...dbRecordsWithNames,
      ...hikvisionRecords,
    ];

    allRecords.sort((a, b) => {
      if (a.date === b.date) {
        return (a.employeeName || "").localeCompare(b.employeeName || "");
      }
      return new Date(a.date).getTime() < new Date(b.date).getTime() ? 1 : -1;
    });

    return NextResponse.json({ records: allRecords }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 }
    );
  }
}
