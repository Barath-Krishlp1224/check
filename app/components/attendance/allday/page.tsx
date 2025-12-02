"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  Calendar,
  Loader2,
  Clock,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  Users,
  BarChart3,
} from "lucide-react";

type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName?: string;
  date: string; // ISO string from API
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const page: React.FC = () => {
  const todayDateString = getTodayDateString();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<AttendanceMode | "ALL">(
    "ALL"
  );

  // ⬇️ IMPORTANT: no date filter at start
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // ----- LOAD DATA FROM /api/attendance/all -----
  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const res = await fetch("/api/attendance/all", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();

      console.log("attendance/all records:", json.records?.length, json.records?.[0]);

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
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // ----- HELPERS -----
  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10); // yyyy-mm-dd
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

  // ----- EMPLOYEE DROPDOWN OPTIONS -----
  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, { employeeId: string; employeeName: string }>();
    attendance.forEach((r) => {
      if (!map.has(r.employeeId)) {
        map.set(r.employeeId, {
          employeeId: r.employeeId,
          employeeName: r.employeeName || r.employeeId,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.employeeName || "").localeCompare(b.employeeName || "")
    );
  }, [attendance]);

  // ----- FILTERED DATA -----
  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      // Employee filter
      if (
        selectedEmployeeId !== "ALL" &&
        r.employeeId !== selectedEmployeeId
      ) {
        return false;
      }

      // Mode filter
      if (selectedMode !== "ALL" && r.mode !== selectedMode) {
        return false;
      }

      // Date filter (only if selected)
      const recordDateStr = formatDate(r.date); // yyyy-mm-dd

      if (fromDate && recordDateStr < fromDate) return false;
      if (toDate && recordDateStr > toDate) return false;

      return true;
    });
  }, [attendance, selectedEmployeeId, selectedMode, fromDate, toDate]);

  const handleClearFilters = () => {
    setSelectedEmployeeId("ALL");
    setSelectedMode("ALL");
    setFromDate("");
    setToDate("");
  };

  // ----- STATS -----
  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const onTime = filteredAttendance.filter((r) =>
      getStatusLabel(r).includes("On Time Login")
    ).length;
    const late = filteredAttendance.filter((r) =>
      getStatusLabel(r).includes("Late")
    ).length;
    const absent = filteredAttendance.filter((r) =>
      getStatusLabel(r).includes("Absent")
    ).length;

    return { total, onTime, late, absent };
  }, [filteredAttendance]);

  // ----- UI -----
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mt-30 justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Attendance Management
              </h1>
              <p className="text-slate-600 text-sm">
                Monitor and track employee attendance records
              </p>
            </div>
            <button
              onClick={loadAttendance}
              disabled={loadingAttendance}
              className="flex items-center gap-2 px-4 py-2.5 bg_white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  loadingAttendance ? "animate-spin" : ""
                } text-black`}
              />
              <span className="font-medium text-sm text-black">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">
                  Total Records
                </p>
                <p className="text-2xl font-bold text_black">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">On Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onTime}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">
                  Late/Early
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.late}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items_center justify-center">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black mb-1">Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absent}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-white" />
              <h2 className="text-lg font-semibold text-white">
                Filter Records
              </h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Employee filter */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-black mb-2">
                  Employee
                </label>
                <select
                  className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="ALL" className="text-gray-500">
                    All Employees
                  </option>
                  {uniqueEmployees.map((emp) => (
                    <option
                      key={emp.employeeId}
                      value={emp.employeeId}
                      className="text-black"
                    >
                      {emp.employeeName} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Mode */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-black mb-2">
                  Work Mode
                </label>
                <select
                  className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  value={selectedMode}
                  onChange={(e) =>
                    setSelectedMode(
                      e.target.value === "ALL"
                        ? "ALL"
                        : (e.target.value as AttendanceMode)
                    )
                  }
                >
                  <option value="ALL" className="text-gray-500">
                    All Modes
                  </option>
                  <option value="IN_OFFICE" className="text-black">
                    In Office
                  </option>
                  <option value="WORK_FROM_HOME" className="text-black">
                    Work From Home
                  </option>
                  <option value="ON_DUTY" className="text-black">
                    On Duty
                  </option>
                  <option value="REGULARIZATION" className="text-black">
                    Regularization
                  </option>
                </select>
              </div>

              {/* From Date */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-black mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* To Date */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-black mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-black text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify_between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-black">
                  Attendance Records
                </h2>
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {filteredAttendance.length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingAttendance && (
              <div className="flex flex-col items-center justify-center py-20 text-black">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-600" />
                <p className="text-sm font-medium text-black">
                  Loading attendance records...
                </p>
              </div>
            )}

            {attendanceError && (
              <div className="flex flex-col items-center justify-center py-20 text-red-500">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8" />
                </div>
                <p className="font-semibold text-lg text-black">
                  Error Loading Records
                </p>
                <p className="text-sm text-black mt-1">{attendanceError}</p>
              </div>
            )}

            {!loadingAttendance &&
              !attendanceError &&
              filteredAttendance.length > 0 && (
                <div className="overflow-x-auto">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Employee Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Work Mode
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Clock In
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Clock Out
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {filteredAttendance.map((record) => {
                          const statusLabel = getStatusLabel(record);

                          return (
                            <tr
                              key={record._id}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                    {(record.employeeName || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-black">
                                    {record.employeeName || "-"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span className="text-xs font-mono text-gray-500 bg-slate-100 px-2 py-1 rounded">
                                  {record.employeeId}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getModeBadgeClass(
                                    record.mode
                                  )}`}
                                >
                                  {getModeLabel(record.mode)}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-black font-medium">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-black font-medium">
                                {formatTime(record.punchInTime)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-black font-medium">
                                {formatTime(record.punchOutTime)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-black font-semibold">
                                {getDuration(record)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusBadgeClass(
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

            {!loadingAttendance &&
              !attendanceError &&
              filteredAttendance.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-black font-semibold text-lg">
                    No Records Found
                  </p>
                  <p className="text-black text-sm mt-1">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
