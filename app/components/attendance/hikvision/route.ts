// app/api/attendance/hikvision/route.ts
import { NextResponse } from "next/server";
// @ts-ignore
import DigestFetch from "digest-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ================= CONFIGURATION =================
// Move these to .env.local in your project:
//
// HIKVISION_IP=192.168.1.113
// HIKVISION_USERNAME=admin
// HIKVISION_PASSWORD=Lemonpay@321
// HIKVISION_START_TIME=2025-11-03T00:00:00+05:30
// ==================================================

const CONFIG = {
  ip: process.env.HIKVISION_IP || "192.168.1.113",
  username: process.env.HIKVISION_USERNAME || "admin",
  password: process.env.HIKVISION_PASSWORD || "password",
  startTime:
    process.env.HIKVISION_START_TIME || "2025-11-03T00:00:00+05:30",
};

// Helper to get current time in IST without milliseconds
function getCurrentTimeIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().replace("Z", "").slice(0, 19) + "+05:30";
}

// Map Hikvision minor codes to operation labels (optional, for debugging)
function getOperationName(minor: number): string {
  const codes: Record<number, string> = {
    1: "Alarm",
    75: "Door Unlocked",
    76: "Door Locked",
    34: "Face Authentication Pass",
    38: "Face Authentication Fail",
    8: "Card Swiped",
  };
  return codes[minor] || "Unknown Event";
}

// Type of raw logs from Hikvision
interface HikvisionLog {
  time: string;
  minor: number;
  employeeNoString?: string;
  employeeNo?: string;
  name?: string;
  cardNo?: string;
}

// Type we will send to the frontend
type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

async function fetchHikvisionLogs(): Promise<HikvisionLog[]> {
  const client = new DigestFetch(CONFIG.username, CONFIG.password);
  const url = `http://${CONFIG.ip}/ISAPI/AccessControl/AcsEvent?format=json`;

  const endTimeSafe = getCurrentTimeIST();

  let allLogs: HikvisionLog[] = [];
  let searchPosition = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const payload = {
      AcsEventCond: {
        searchID: "1",
        searchResultPosition: searchPosition,
        maxResults: 30, // safe batch size
        major: 0,
        minor: 0,
        startTime: CONFIG.startTime,
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

  // Newest first
  return allLogs.reverse();
}

function buildAttendanceFromLogs(logs: HikvisionLog[]): AttendanceRecord[] {
  // Filter to only "real" entry/exit events if you want
  const relevantLogs = logs.filter((log) =>
    [34, 8].includes(log.minor) // Face pass or card swipe
  );

  // Group by employee + date
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

  for (const log of relevantLogs) {
    const empId = log.employeeNoString || log.employeeNo || "";
    if (!empId) continue;

    // Date part from Hikvision time string (YYYY-MM-DD from local time)
    // Example time: "2025-11-03T09:12:34+05:30"
    const dateKey = log.time.slice(0, 10);

    const key = `${empId}-${dateKey}`;
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
      // Compare times
      const currentTime = new Date(log.time).getTime();
      const firstTime = new Date(existing.firstTime).getTime();
      const lastTime = new Date(existing.lastTime).getTime();

      if (currentTime < firstTime) {
        existing.firstTime = log.time;
      }
      if (currentTime > lastTime) {
        existing.lastTime = log.time;
      }

      // Prefer non-empty name
      if (!existing.employeeName && log.name) {
        existing.employeeName = log.name;
      }
    }
  }

  const records: AttendanceRecord[] = [];

  for (const group of groups.values()) {
    const { employeeId, employeeName, date, firstTime, lastTime } = group;

    records.push({
      _id: `${employeeId}-${date}`,
      employeeId,
      employeeName,
      date, // "YYYY-MM-DD"
      punchInTime: firstTime,
      punchOutTime: lastTime,
      mode: "IN_OFFICE", // always IO as you asked
      punchInLatitude: null,
      punchInLongitude: null,
      punchOutLatitude: null,
      punchOutLongitude: null,
    });
  }

  // Sort: latest date first, then by name
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
    const logs = await fetchHikvisionLogs();
    const records = buildAttendanceFromLogs(logs);
    return NextResponse.json({ records });
  } catch (error: any) {
    console.error("Hikvision API fatal error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Hikvision attendance." },
      { status: 500 }
    );
  }
}
