import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
// @ts-ignore
import DigestFetch from "digest-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HIK_CONFIG = {
  ip: process.env.HIKVISION_IP || "192.168.1.113",
  username: process.env.HIKVISION_USERNAME || "admin",
  password: process.env.HIKVISION_PASSWORD || "password",
};

function getISTNow(): Date {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffsetMs);
}

function getCurrentTimeIST(): string {
  const istDate = getISTNow();
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(istDate.getUTCDate()).padStart(2, "0");
  const hh = String(istDate.getUTCHours()).padStart(2, "0");
  const mm = String(istDate.getUTCMinutes()).padStart(2, "0");
  const ss = String(istDate.getUTCSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}+05:30`;
}

function getTodayStartIST(): string {
  const istDate = getISTNow();
  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(istDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T00:00:00+05:30`;
}

function extractDateKey(value: string | Date | undefined | null): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (value.length === 10 && !value.includes("T")) {
      return value;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

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

async function fetchHikvisionLogs(): Promise<HikvisionLog[]> {
  console.log("HIKVISION CONFIG", {
    ip: HIK_CONFIG.ip,
    username: HIK_CONFIG.username,
    hasPassword: !!HIK_CONFIG.password,
  });

  const client = new DigestFetch(HIK_CONFIG.username, HIK_CONFIG.password);
  const url = `http://${HIK_CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

  const endTimeSafe = getCurrentTimeIST();
  const startTimeToday = getTodayStartIST();

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
        startTime: startTimeToday,
        endTime: endTimeSafe,
      },
    };

    const response = await client.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `Hikvision Error: ${response.status} - ${response.statusText}. Body: ${text}`
      );
      return allLogs;
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

  return allLogs.reverse();
}

function buildHikvisionAttendanceForToday(
  logs: HikvisionLog[]
): AttendanceRecordOut[] {
  const todayIST = getCurrentTimeIST().slice(0, 10);

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
    const dateKey = log.time.slice(0, 10);
    if (dateKey !== todayIST) continue;

    const empId =
      log.employeeNoString ||
      log.employeeNo ||
      log.cardNo ||
      log.name ||
      "UNKNOWN";

    const key = empId;
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

export async function GET() {
  try {
    await connectDB();

    const todayIST = getCurrentTimeIST().slice(0, 10);

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

    const dbRecordsToday = dbRecords.filter((r: any) => {
      return extractDateKey(r.date) === todayIST;
    });

    const dbRecordsWithNames: AttendanceRecordOut[] = dbRecordsToday.map(
      (r: any) => ({
        _id: r._id.toString(),
        employeeId: r.employeeId,
        employeeName: nameMap.get(r.employeeId) || null,
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

    console.log("DB TODAY records count:", dbRecordsWithNames.length);

    let hikvisionRecords: AttendanceRecordOut[] = [];
    try {
      const logs = await fetchHikvisionLogs();
      hikvisionRecords = buildHikvisionAttendanceForToday(logs);
    } catch (e) {
      console.error("Failed to fetch Hikvision logs:", e);
    }

    console.log("Hikvision TODAY records count:", hikvisionRecords.length);

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

    console.log("Final allRecords length:", allRecords.length);
    console.log("Sample record:", allRecords[0]);

    return NextResponse.json({ records: allRecords }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 }
    );
  }
}
