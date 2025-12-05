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
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

interface Employee {
  employeeId: string;
  employeeName?: string;
  department?: string | null;
  role?: string | null;
  team?: string | null;
  category?: string | null;
}

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
};

const getDateKey = (value?: string) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const App: React.FC = () => {
  const todayDateString = getTodayDateString();
  const yesterdayDateString = getYesterdayDateString();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<AttendanceMode | "ALL">(
    "ALL"
  );

  const [fromDate, setFromDate] = useState<string>(todayDateString);
  const [toDate, setToDate] = useState<string>(todayDateString);

  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const res = await fetch("/api/attendance/all", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.records) {
        throw new Error(json.error || "Failed to load attendance records.");
      }

      const records: AttendanceRecord[] = (json.records as AttendanceRecord[]).sort(
        (a: AttendanceRecord, b: AttendanceRecord) => {
          const dateKeyA = getDateKey(a.date);
          const dateKeyB = getDateKey(b.date);
          if (dateKeyA !== dateKeyB) {
            return dateKeyB.localeCompare(dateKeyA);
          }
          return (a.employeeName || "").localeCompare(b.employeeName || "");
        }
      );

      setAttendance(records);
      setAttendanceError(null);
    } catch (error) {
      console.error(error);
      setAttendanceError("Failed to load attendance records.");
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [todayDateString, yesterdayDateString]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load employees");
      }

      const list: Employee[] = (json.employees || [])
        .map((emp: any) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          department: emp.department ?? null,
          role: emp.role ?? null,
          team: emp.team ?? null,
          category: emp.category ?? null,
        }))
        .filter((emp: Employee) => emp.employeeId);

      setEmployees(list);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const formatDate = (value?: string) => {
    const key = getDateKey(value);
    if (!key) return "-";
    const parts = key.split("-");
    if (parts.length !== 3) return key;
    const [year, month, day] = parts;
    return `${day}-${month}-${year}`;
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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
    const recordDateKey = getDateKey(date);

    if (!punchInTime && !punchOutTime) return "Absent";

    let isLate = false;
    let isGrace = false;
    let isEarlyLogout = false;

    const refDate = new Date(`${recordDateKey}T00:00:00`);

    const loginTime_930 = new Date(refDate);
    loginTime_930.setHours(9, 30, 0, 0);

    const loginTime_935 = new Date(refDate);
    loginTime_935.setHours(9, 35, 0, 0);

    const logoutTime_1830 = new Date(refDate);
    logoutTime_1830.setHours(18, 30, 0, 0);

    const getNormalizedTime = (timeString: string | null | undefined) => {
      if (!timeString) return null;
      try {
        const punchTime = new Date(timeString);
        const normalized = new Date(refDate);
        normalized.setHours(
          punchTime.getHours(),
          punchTime.getMinutes(),
          punchTime.getSeconds(),
          punchTime.getMilliseconds()
        );
        if (punchTime.getDate() > refDate.getDate() && normalized.getHours() < 9) {
          normalized.setDate(normalized.getDate() + 1);
        }
        return normalized;
      } catch {
        return null;
      }
    };

    const punchIn = getNormalizedTime(punchInTime);
    const punchOut = getNormalizedTime(punchOutTime);

    if (punchIn) {
      if (punchIn.getTime() > loginTime_935.getTime()) {
        isLate = true;
      } else if (punchIn.getTime() >= loginTime_930.getTime()) {
        isGrace = true;
      }
    }

    if (punchOut) {
      if (punchOut.getTime() < logoutTime_1830.getTime()) {
        isEarlyLogout = true;
      }
    }

    const parts: string[] = [];

    if (!punchIn && punchOut) {
      parts.push("No Login");
    } else if (punchIn) {
      if (isLate) parts.push("Late Login");
      else if (isGrace) parts.push("Grace Login");
      else parts.push("On Time Login");
    }

    if (!punchOut && punchIn) {
      parts.push("No Logout");
    } else if (punchOut) {
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

  const normalizeMode = (mode?: AttendanceMode): AttendanceMode => {
    return mode || "IN_OFFICE";
  };

  const getModeLabel = (mode?: AttendanceMode) => {
    const m = normalizeMode(mode);
    switch (m) {
      case "IN_OFFICE":
        return "In Office";
      case "WORK_FROM_HOME":
        return "Work From Home";
      case "ON_DUTY":
        return "On Duty";
      case "REGULARIZATION":
        return "Regularization";
      default:
        return m;
    }
  };

  const getModeBadgeClass = (mode?: AttendanceMode) => {
    const m = normalizeMode(mode);
    switch (m) {
      case "IN_OFFICE":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "WORK_FROM_HOME":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "ON_DUTY":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "REGULARIZATION":
        return "bg-slate-50 text-slate-700 border border-slate-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const uniqueEmployees = useMemo(() => {
    if (employees.length > 0) {
      return [...employees]
        .map((emp) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName || emp.employeeId,
        }))
        .sort((a, b) =>
          (a.employeeName || "").localeCompare(b.employeeName || "")
        );
    }

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
  }, [employees, attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      if (selectedEmployeeId !== "ALL" && r.employeeId !== selectedEmployeeId) {
        return false;
      }

      if (selectedMode !== "ALL") {
        const normalized = normalizeMode(r.mode);
        if (normalized !== selectedMode) return false;
      }

      const recordDateStr = getDateKey(r.date);

      if (fromDate && recordDateStr < fromDate) return false;
      if (toDate && recordDateStr > toDate) return false;

      return true;
    });
  }, [attendance, selectedEmployeeId, selectedMode, fromDate, toDate]);

  const handleClearFilters = () => {
    setSelectedEmployeeId("ALL");
    setSelectedMode("ALL");
    setFromDate(todayDateString);
    setToDate(todayDateString);
  };

  const isFounder = (emp: Employee): boolean => {
    const combined = `${emp.role ?? ""} ${emp.category ?? ""}`.toLowerCase();
    return combined.includes("founder"); // matches "Founder", "Co-Founder", etc.
  };

  const stats = useMemo(() => {
    const total = filteredAttendance.length;

    const onTime = filteredAttendance.filter((r) =>
      getStatusLabel(r).includes("On Time Login")
    ).length;

    const late = filteredAttendance.filter((r) =>
      getStatusLabel(r).includes("Late") ||
      getStatusLabel(r).includes("Grace")
    ).length;

    let absent = 0;

    if (employees.length > 0) {
      const employeesToCheck =
        selectedEmployeeId === "ALL"
          ? employees
          : employees.filter((e) => e.employeeId === selectedEmployeeId);

      employeesToCheck.forEach((emp) => {
        // Skip founders from absent calculation
        if (isFounder(emp)) return;

        const empRecords = filteredAttendance.filter(
          (r) => r.employeeId === emp.employeeId
        );

        // No entry at all in this filter range => Absent
        if (empRecords.length === 0) {
          absent += 1;
          return;
        }

        // If every record is effectively "Absent"
        const allAbsent = empRecords.every((r) =>
          getStatusLabel(r).includes("Absent")
        );

        if (allAbsent) {
          absent += 1;
        }
      });
    } else {
      // Fallback: just count rows with "Absent" in status
      absent = filteredAttendance.filter((r) =>
        getStatusLabel(r).includes("Absent")
      ).length;
    }

    const totalEmployees = employees.filter((emp) => !isFounder(emp)).length;

    return { total, onTime, late, absent, totalEmployees };
  }, [filteredAttendance, employees, selectedEmployeeId]);

  const convertToCSV = (data: AttendanceRecord[]): string => {
    const header = [
      "Employee Name",
      "Employee ID",
      "Work Mode",
      "Date",
      "Clock In Time",
      "Clock Out Time",
      "Duration",
      "Status",
    ].join(",");

    const rows = data.map((record) => {
      const statusLabel = getStatusLabel(record);
      return [
        `"${record.employeeName || record.employeeId}"`,
        record.employeeId,
        getModeLabel(record.mode),
        formatDate(record.date),
        formatTime(record.punchInTime).replace(/,/g, ""),
        formatTime(record.punchOutTime).replace(/,/g, ""),
        getDuration(record),
        `"${statusLabel}"`,
      ].join(",");
    });

    return [header, ...rows].join("\n");
  };

  const handleExport = () => {
    if (filteredAttendance.length === 0) {
      alert("No records to export.");
      return;
    }

    const csvContent = convertToCSV(filteredAttendance);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const startDate = formatDate(fromDate);
      const endDate = formatDate(toDate);
      const filename = `Attendance_Report_${startDate}_to_${endDate}.csv`;

      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Download is not supported on this browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mt-[5%] mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Attendance Management
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Monitor and track employee attendance records with comprehensive insights
          </p>
          <div className="mt-6">
            <button
              onClick={loadAttendance}
              disabled={loadingAttendance}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  loadingAttendance ? "animate-spin" : ""
                } text-blue-600`}
              />
              <span className="font-semibold text-sm text-gray-700">
                Refresh Data
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            {/* Status cards - no icons */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Total Employees (excluding founders) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalEmployees}
                </p>
              </div>

              {/* Total Records */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Records
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>

              {/* On Time */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  On Time
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onTime}
                </p>
              </div>

              {/* Late/Grace */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Late/Grace
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.late}
                </p>
              </div>

              {/* Absent */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Absent
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absent}
                </p>
              </div>
            </div>

            {/* Filters card */}
            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Filter Records</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Employee
                    </label>
                    <select
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                      <option value="ALL">All Employees</option>
                      {uniqueEmployees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.employeeName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Work Mode
                    </label>
                    <select
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
                      value={selectedMode}
                      onChange={(e) =>
                        setSelectedMode(
                          e.target.value === "ALL"
                            ? "ALL"
                            : (e.target.value as AttendanceMode)
                        )
                      }
                    >
                      <option value="ALL">All Modes</option>
                      <option value="IN_OFFICE">In Office</option>
                      <option value="WORK_FROM_HOME">Work From Home</option>
                      <option value="ON_DUTY">On Duty</option>
                      <option value="REGULARIZATION">Regularization</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      From Date
                    </label>
                    <input
                      type="date"
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium transition-all"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      To Date
                    </label>
                    <input
                      type="date"
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium transition-all"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-3 rounded-xl border-2 border-slate-200 text-gray-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-500/30"
                  >
                    <Download className="w-5 h-5" />
                    Export to CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: table */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b-2 border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Attendance Records
                    </h2>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                      {filteredAttendance.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingAttendance && (
                  <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-600" />
                    <p className="text-base font-semibold text-gray-700">
                      Loading attendance records...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Please wait</p>
                  </div>
                )}

                {attendanceError && (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-5">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <p className="font-bold text-xl text-gray-900 mb-2">
                      Error Loading Records
                    </p>
                    <p className="text-sm text-gray-600">{attendanceError}</p>
                  </div>
                )}

                {!loadingAttendance &&
                  !attendanceError &&
                  filteredAttendance.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border-2 border-slate-100">
                      <div className="h-[25rem] overflow-y-scroll">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Employee Name
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                ID
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Work Mode
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Clock In
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Clock Out
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Duration
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {filteredAttendance.map((record) => {
                              const statusLabel = getStatusLabel(record);
                              const displayName =
                                record.employeeName || record.employeeId || "-";

                              return (
                                <tr
                                  key={record._id}
                                  className="hover:bg-blue-50/50 transition-colors"
                                >
                                  <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-base mr-3 shadow-sm">
                                        {displayName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-sm font-semibold text-gray-900">
                                        {displayName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="text-xs font-mono text-gray-600 bg-slate-100 px-3 py-1.5 rounded-lg font-semibold">
                                      {record.employeeId}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${getModeBadgeClass(
                                        record.mode
                                      )}`}
                                    >
                                      {getModeLabel(record.mode)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    {formatDate(record.date)}
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    {formatTime(record.punchInTime)}
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    {formatTime(record.punchOutTime)}
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-bold">
                                    {getDuration(record)}
                                  </td>
                                  <td className="px-6 py-5 whitespace-nowrap">
                                    <span
                                      className={`px-3 py-1.5 inline-flex text-xs font-semibold rounded-lg ${getStatusBadgeClass(
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
                    <div className="flex flex-col items-center justify-center py-24">
                      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                        <Clock className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-bold text-xl mb-2">
                        No Records Found
                      </p>
                      <p className="text-gray-600 text-sm">
                        Try adjusting your filters to see more results
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
