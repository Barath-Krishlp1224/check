"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Loader2, Clock, XCircle } from "lucide-react";

type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

// --- Constants for Geolocation ---
const OFFICE_LAT = 11.939198361614558;
const OFFICE_LON = 79.81654494108358;
const OFFICE_ALLOWED_RADIUS_METERS = 60;

// --- Helper Functions ---

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const getTodayDateKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const extractDateKey = (value?: string | null) => {
    if (!value) return "";
    return value.slice(0, 10); // Extracts YYYY-MM-DD
};


interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName?: string | null;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

const AttendanceRecords: React.FC = () => {
  const todayDateKey = getTodayDateKey();
  
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const loadAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const res = await fetch("/api/attendance/all", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load attendance records.");
        }

        const records: AttendanceRecord[] = json.records || [];

        // Sort by date descending (latest first)
        records.sort(
          (a: AttendanceRecord, b: AttendanceRecord) =>
            new Date(extractDateKey(b.date)).getTime() - new Date(extractDateKey(a.date)).getTime()
        );

        setAllAttendance(records);
        setAttendanceError(null);
      } catch (error) {
        console.error(error);
        setAttendanceError("Failed to load attendance records.");
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadAttendance();
  }, []);

  // --- Filter Records to show only Today's Data ---
  const todayAttendance = useMemo(() => {
    return allAttendance.filter(record => extractDateKey(record.date) === todayDateKey);
  }, [allAttendance, todayDateKey]);


  // --- Formatters and Status Helpers ---

  const formatDate = (value?: string) => {
    const key = extractDateKey(value);
    if (!key) return "-";
    
    // Format YYYY-MM-DD to DD-MM-YYYY
    const parts = key.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}-${month}-${year}`;
    }
    return key;
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    // 12-hour format with AM/PM
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getDuration = (record: AttendanceRecord) => {
    if (!record.punchInTime || !record.punchOutTime) return "-";
    const start = new Date(record.punchInTime);
    const end = new Date(record.punchOutTime);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return "-";
    }

    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) return `${minutes} min`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const getStatusLabel = (record: AttendanceRecord): string => {
    const { punchInTime, punchOutTime, date } = record;
    const recordDateKey = extractDateKey(date);

    if (!punchInTime && !punchOutTime) return "Absent";

    let isLate = false;
    let isGrace = false;
    let isEarlyLogout = false;

    // Use the date key to create consistent comparison points in local timezone
    const refDate = new Date(`${recordDateKey}T00:00:00`);

    // Target Times (9:30 AM, 9:35 AM, 6:30 PM)
    const loginTime_930 = new Date(refDate);
    loginTime_930.setHours(9, 30, 0, 0);

    const loginTime_935 = new Date(refDate);
    loginTime_935.setHours(9, 35, 0, 0);

    const logoutTime_1830 = new Date(refDate);
    logoutTime_1830.setHours(18, 30, 0, 0);

    if (punchInTime) {
      const punchIn = new Date(punchInTime);

      if (punchIn.getTime() > loginTime_935.getTime()) {
        isLate = true;
      } else if (punchIn.getTime() >= loginTime_930.getTime()) {
        isGrace = true;
      }
    }

    if (punchOutTime) {
      const punchOut = new Date(punchOutTime);

      if (punchOut.getTime() < logoutTime_1830.getTime()) {
        isEarlyLogout = true;
      }
    }

    const parts: string[] = [];

    if (!punchInTime && punchOutTime) {
      parts.push("No Login");
    } else if (punchInTime) {
      if (isLate) parts.push("Late Login");
      else if (isGrace) parts.push("Grace Login");
      else parts.push("On Time Login");
    }

    if (!punchOutTime && punchInTime) {
      parts.push("No Logout");
    } else if (punchOutTime) {
      if (isEarlyLogout) parts.push("Early Logout");
      else parts.push("On Time Logout");
    }

    return parts.join(" | ");
  };

  const getStatusBadgeClass = (label: string) => {
    if (label.includes("Absent") || label.includes("No Login")) {
      return "bg-red-100 text-red-800";
    }
    if (label.includes("Late") || label.includes("Early")) {
      return "bg-yellow-100 text-yellow-800";
    }
    if (label.includes("Grace")) {
      return "bg-blue-100 text-blue-800";
    }
    if (label.includes("On Time")) {
      return "bg-green-100 text-green-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getModeAbbreviation = (mode?: AttendanceMode) => {
    if (!mode) return "-";
    switch (mode) {
      case "IN_OFFICE":
        return "IO";
      case "WORK_FROM_HOME":
        return "WFH";
      case "ON_DUTY":
        return "OD";
      case "REGULARIZATION":
        return "REG";
      default:
        return mode;
    }
  };

  const getModeBadgeClass = (mode?: AttendanceMode) => {
    switch (mode) {
      case "IN_OFFICE":
        return "bg-indigo-100 text-indigo-800";
      case "WORK_FROM_HOME":
        return "bg-emerald-100 text-emerald-800";
      case "ON_DUTY":
        return "bg-orange-100 text-orange-800";
      case "REGULARIZATION":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPunchInDistanceLabel = (record: AttendanceRecord) => {
    if (record.punchInLatitude == null || record.punchInLongitude == null || record.mode !== "IN_OFFICE") {
      return "-";
    }
    const d = getDistanceMeters(
      OFFICE_LAT,
      OFFICE_LON,
      record.punchInLatitude,
      record.punchInLongitude
    );
    return `${d} m`;
  };

  const getPunchInDistanceClass = (record: AttendanceRecord) => {
    if (record.punchInLatitude == null || record.punchInLongitude == null || record.mode !== "IN_OFFICE") {
      return "text-gray-500";
    }
    const d = getDistanceMeters(
      OFFICE_LAT,
      OFFICE_LON,
      record.punchInLatitude,
      record.punchInLongitude
    );
    return d <= OFFICE_ALLOWED_RADIUS_METERS ? "text-green-700 font-bold" : "text-red-700 font-bold";
  };

  // --- Render Component ---

  return (
    <div
      className={`transition-all duration-700 delay-500 ${
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="mb-6 flex items-center gap-4 group">
        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
          <Calendar className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Attendance Records ({formatDate(todayDateKey)})
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md h-full w-full min-w-[500px]">
        {loadingAttendance && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p>Fetching today&apos;s records...</p>
          </div>
        )}

        {attendanceError && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500 p-4">
            <XCircle className="w-6 h-6 mb-2" />
            <p className="font-medium">Error: {attendanceError}</p>
          </div>
        )}

        {!loadingAttendance && !attendanceError && todayAttendance.length > 0 && (
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-1">
              Today&apos;s Attendance Summary
            </h3>
            <div className="overflow-x-auto overflow-y-auto h-96 border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Out
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      In Distance
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todayAttendance.map((record) => {
                    const statusLabel = getStatusLabel(record);
                    return (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.employeeName || record.employeeId || "-"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModeBadgeClass(
                              record.mode
                            )}`}
                          >
                            {getModeAbbreviation(record.mode)}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          {formatTime(record.punchInTime)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          {formatTime(record.punchOutTime)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          {getDuration(record)}
                        </td>
                        <td
                          className={`px-2 py-2 whitespace-nowrap text-xs ${getPunchInDistanceClass(
                            record
                          )}`}
                        >
                          {getPunchInDistanceLabel(record)}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                              statusLabel
                            )}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loadingAttendance && !attendanceError && todayAttendance.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
            <Clock className="w-5 h-5 mr-2" />
            <p className="mt-2 font-medium">No attendance records for today ({formatDate(todayDateKey)}).</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRecords;