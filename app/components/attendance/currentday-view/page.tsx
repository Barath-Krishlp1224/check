"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Loader2, Clock, XCircle } from "lucide-react";

type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
}

const AttendanceRecords: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const loadAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const res = await fetch("/api/attendance/all");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load attendance records.");
        }

        const records: AttendanceRecord[] = (json.records || []).sort(
          (a: AttendanceRecord, b: AttendanceRecord) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAttendance(records);
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

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getDuration = (record: AttendanceRecord) => {
    if (!record.punchInTime || !record.punchOutTime) return "-";
    const start = new Date(record.punchInTime);
    const end = new Date(record.punchOutTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
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
    const { punchInTime, punchOutTime } = record;

    if (!punchInTime && !punchOutTime) return "Absent";

    let isLate = false;
    let isGrace = false;
    let isEarlyLogout = false;

    if (punchInTime) {
      const d = new Date(punchInTime);
      const h = d.getHours();
      const m = d.getMinutes();

      const after930 = h > 9 || (h === 9 && m >= 30);
      const after935 = h > 9 || (h === 9 && m > 35);

      if (after935) {
        isLate = true;
      } else if (after930) {
        isGrace = true;
      }
    }

    if (punchOutTime) {
      const d = new Date(punchOutTime);
      const h = d.getHours();
      const m = d.getMinutes();

      const before630 = h < 18 || (h === 18 && m < 30);
      if (before630) {
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

  const getModeLabel = (mode?: AttendanceMode) => {
    if (!mode) return "-";
    switch (mode) {
      case "IN_OFFICE":
        return "In Office";
      case "WORK_FROM_HOME":
        return "Work From Home";
      case "ON_DUTY":
        return "On Duty";
      case "REGULARIZATION":
        return "Regularization";
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

  const recentAttendance = attendance.slice(0, 5);
  const otherAttendance = attendance.slice(5);

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
            Attendance Records
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md h-full w-full min-w-[520px]">
        {loadingAttendance && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p>Fetching recent records...</p>
          </div>
        )}

        {attendanceError && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500 p-4">
            <XCircle className="w-6 h-6 mb-2" />
            <p className="font-medium">Error: {attendanceError}</p>
          </div>
        )}

        {!loadingAttendance && !attendanceError && attendance.length > 0 && (
          <div className="flex flex-col">
            {/* Most recent section */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-1">
              Most Recent Records
            </h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emp ID
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
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAttendance.map((record) => {
                    const statusLabel = getStatusLabel(record);
                    return (
                      <tr key={record._id}>
                        <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.employeeName || "-"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          {record.employeeId}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModeBadgeClass(
                              record.mode
                            )}`}
                          >
                            {getModeLabel(record.mode)}
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

            {/* Previous records */}
            {otherAttendance.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-1">
                  Previous Records
                </h3>
                <div className="overflow-y-auto max-h-48 border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emp ID
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
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {otherAttendance.map((record) => {
                        const statusLabel = getStatusLabel(record);
                        return (
                          <tr key={record._id}>
                            <td className="px-2 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.employeeName || "-"}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                              {record.employeeId}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-700">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getModeBadgeClass(
                                  record.mode
                                )}`}
                              >
                                {getModeLabel(record.mode)}
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
              </>
            )}

            {attendance.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                <Clock className="w-5 h-5 mr-2" />
                <p>No attendance records found.</p>
              </div>
            )}
          </div>
        )}

        {!loadingAttendance && !attendanceError && attendance.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
            <Clock className="w-5 h-5 mr-2" />
            <p>No attendance records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRecords;
