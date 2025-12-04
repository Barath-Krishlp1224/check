"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Loader2, Clock, XCircle, Search, Filter, RefreshCw } from "lucide-react";

type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

const OFFICE_LAT = 11.939198361614558;
const OFFICE_LON = 79.81654494108358;
const OFFICE_ALLOWED_RADIUS_METERS = 60;

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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setLoaded(true);
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await fetch("/api/attendance/all");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load attendance records.");
      }

      const records: AttendanceRecord[] = json.records || [];

      records.sort(
        (a: AttendanceRecord, b: AttendanceRecord) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAttendance(records);
      setAttendanceError(null);
    } catch (error) {
      setAttendanceError("Failed to load attendance records.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    if (value.length === 10 && !value.includes("T")) {
      return value;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toISOString().slice(0, 10);
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
      return "bg-red-100 text-red-800 border border-red-200";
    }
    if (label.includes("Late") || label.includes("Early")) {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
    if (label.includes("Grace")) {
      return "bg-blue-100 text-blue-800 border border-blue-200";
    }
    if (label.includes("On Time")) {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    return "bg-gray-100 text-gray-800 border border-gray-200";
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
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "WORK_FROM_HOME":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "ON_DUTY":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "REGULARIZATION":
        return "bg-slate-100 text-slate-800 border border-slate-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getPunchInDistanceLabel = (record: AttendanceRecord) => {
    if (record.punchInLatitude == null || record.punchInLongitude == null) {
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
    if (record.punchInLatitude == null || record.punchInLongitude == null) {
      return "text-gray-500";
    }
    const d = getDistanceMeters(
      OFFICE_LAT,
      OFFICE_LON,
      record.punchInLatitude,
      record.punchInLongitude
    );
    return d <= OFFICE_ALLOWED_RADIUS_METERS ? "text-green-700 font-semibold" : "text-red-700 font-semibold";
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const matchesSearch = 
        searchTerm === "" ||
        (record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMode =
        selectedMode === "ALL" || record.mode === selectedMode;

      const statusLabel = getStatusLabel(record);
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "LATE" && statusLabel.includes("Late")) ||
        (selectedStatus === "EARLY" && statusLabel.includes("Early")) ||
        (selectedStatus === "ON_TIME" && statusLabel.includes("On Time") && !statusLabel.includes("Late") && !statusLabel.includes("Early")) ||
        (selectedStatus === "ABSENT" && statusLabel.includes("Absent")) ||
        (selectedStatus === "GRACE" && statusLabel.includes("Grace"));

      const matchesDate =
        dateFilter === "" || formatDate(record.date) === dateFilter;

      return matchesSearch && matchesMode && matchesStatus && matchesDate;
    });
  }, [attendance, searchTerm, selectedMode, selectedStatus, dateFilter]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMode("ALL");
    setSelectedStatus("ALL");
    setDateFilter("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div
        className={`transition-all duration-700 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        } max-w-7xl w-full mx-auto`}
      >
        <div className="mt-[10%] mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Attendance Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Track and manage employee attendance records
                </p>
              </div>
            </div>
            <button
              onClick={loadAttendance}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-black" />
              <span className="font-medium text-black">Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Employee
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name or ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Mode
              </label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              >
                <option value="ALL">All Modes</option>
                <option value="IN_OFFICE">In Office</option>
                <option value="WORK_FROM_HOME">Work From Home</option>
                <option value="ON_DUTY">On Duty</option>
                <option value="REGULARIZATION">Regularization</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              >
                <option value="ALL">All Status</option>
                <option value="ON_TIME">On Time</option>
                <option value="LATE">Late</option>
                <option value="EARLY">Early Logout</option>
                <option value="GRACE">Grace Period</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Records</div>
            <div className="text-2xl font-bold text-gray-900">{filteredAttendance.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">On Time</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredAttendance.filter(r => {
                const status = getStatusLabel(r);
                return status.includes("On Time") && !status.includes("Late");
              }).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Late/Early</div>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredAttendance.filter(r => {
                const status = getStatusLabel(r);
                return status.includes("Late") || status.includes("Early");
              }).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Absent</div>
            <div className="text-2xl font-bold text-red-600">
              {filteredAttendance.filter(r => getStatusLabel(r).includes("Absent")).length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loadingAttendance && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
              <p className="text-lg">Loading attendance records...</p>
            </div>
          )}

          {attendanceError && (
            <div className="flex flex-col items-center justify-center h-96 text-red-500 p-4">
              <XCircle className="w-8 h-8 mb-3" />
              <p className="font-medium text-lg">Error: {attendanceError}</p>
            </div>
          )}

          {!loadingAttendance && !attendanceError && filteredAttendance.length > 0 && (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Punch In
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Punch Out
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Distance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((record, index) => {
                    const statusLabel = getStatusLabel(record);
                    return (
                      <tr 
                        key={record._id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {record.employeeName || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.employeeId || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getModeBadgeClass(
                              record.mode
                            )}`}
                          >
                            {getModeAbbreviation(record.mode)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatTime(record.punchInTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatTime(record.punchOutTime)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {getDuration(record)}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm ${getPunchInDistanceClass(
                            record
                          )}`}
                        >
                          {getPunchInDistanceLabel(record)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
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
          )}

          {!loadingAttendance && !attendanceError && filteredAttendance.length === 0 && (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <Clock className="w-12 h-12 mb-3 text-gray-400" />
              <p className="text-lg font-medium">No records found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceRecords;