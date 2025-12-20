"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Loader2, Clock, XCircle } from "lucide-react";

type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

const BRANCHES = [
  { name: "Branch 1", lat: 11.939198361614558, lon: 79.81654494108358, radius: 100 },
  { name: "Branch 2", lat: 11.940000000000000, lon: 79.82000000000000, radius: 300 } 
];

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const getBranchValidation = (lat: number, lon: number) => {
  const calculations = BRANCHES.map(branch => {
    const dist = getDistanceMeters(lat, lon, branch.lat, branch.lon);
    return { distance: dist, isAllowed: dist <= branch.radius, branchName: branch.name };
  });
  return calculations.reduce((prev, curr) => (curr.distance < prev.distance ? curr : prev));
};

const getTodayDateKey = () => new Date().toISOString().slice(0, 10);
const extractDateKey = (value?: string | null) => value ? value.slice(0, 10) : "";

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
        if (!res.ok) throw new Error(json.error || "Failed to load records.");
        const records: AttendanceRecord[] = json.records || [];
        records.sort((a, b) => new Date(extractDateKey(b.date)).getTime() - new Date(extractDateKey(a.date)).getTime());
        setAllAttendance(records);
        setAttendanceError(null);
      } catch (error) {
        setAttendanceError("Failed to load attendance records.");
      } finally {
        setLoadingAttendance(false);
      }
    };
    loadAttendance();
  }, []);

  const todayAttendance = useMemo(() => allAttendance.filter(r => extractDateKey(r.date) === todayDateKey), [allAttendance, todayDateKey]);

  const formatDate = (value?: string) => {
    const key = extractDateKey(value);
    if (!key) return "-";
    const [y, m, d] = key.split("-");
    return `${d}-${m}-${y}`;
  };

  const formatTime = (v?: string | null) => {
    if (!v) return "-";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getStatusLabel = (r: AttendanceRecord): string => {
    const key = extractDateKey(r.date);
    if (!r.punchInTime && !r.punchOutTime) return "Absent";
    const ref = new Date(`${key}T00:00:00`);
    const t930 = new Date(ref).setHours(9, 30, 0, 0), t935 = new Date(ref).setHours(9, 35, 0, 0), t1830 = new Date(ref).setHours(18, 30, 0, 0);
    let parts = [];
    if (r.punchInTime) {
      const p = new Date(r.punchInTime).getTime();
      parts.push(p > t935 ? "Late In" : p >= t930 ? "Grace In" : "On Time In");
    } else parts.push("No Login");
    if (r.punchOutTime) parts.push(new Date(r.punchOutTime).getTime() < t1830 ? "Early Out" : "On Time Out");
    else parts.push("No Logout");
    return parts.join(" | ");
  };

  const getStatusBadgeClass = (l: string) => {
    if (l.includes("Absent") || l.includes("No Login")) return "bg-red-100 text-black";
    if (l.includes("Late") || l.includes("Early")) return "bg-yellow-100 text-black";
    return l.includes("On Time") ? "bg-green-100 text-black" : "bg-blue-100 text-black";
  };

  const getModeLabel = (m?: AttendanceMode) => {
    const map = { IN_OFFICE: "IO", WORK_FROM_HOME: "WFH", ON_DUTY: "OD", REGULARIZATION: "REG" };
    return m ? (map as any)[m] || m : "-";
  };

  const getDistInfo = (lat?: number | null, lon?: number | null, mode?: AttendanceMode) => {
    if (lat == null || lon == null) return { label: "-", branch: "", className: "text-gray-400" };
    if (mode !== "IN_OFFICE") return { label: "N/A", branch: "", className: "text-gray-400" };
    const validation = getBranchValidation(lat, lon);
    return { 
      label: `${validation.distance}m`, 
      branch: validation.branchName,
      className: validation.isAllowed ? "text-green-600 font-bold" : "text-red-600 font-bold"
    };
  };

  return (
    <div className={`transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200">
          <Calendar className="w-5 h-5 text-black" />
          <h2 className="text-2xl font-bold text-black">Attendance ({formatDate(todayDateKey)})</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md overflow-hidden">
        {loadingAttendance ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-black">
            <Loader2 className="animate-spin mb-2" />
            <p>Loading...</p>
          </div>
        ) : attendanceError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-black">
            <XCircle className="mb-2" />
            <p>{attendanceError}</p>
          </div>
        ) : todayAttendance.length > 0 ? (
          <div className="overflow-x-auto h-[225px] overflow-y-auto border rounded-lg scrollbar-thin shadow-inner">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  {["Name", "Mode", "In Time", "In Branch/Dist", "Out Time", "Out Branch/Dist", "Status"].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-black uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayAttendance.map(r => {
                  const status = getStatusLabel(r);
                  const inD = getDistInfo(r.punchInLatitude, r.punchInLongitude, r.mode);
                  const outD = getDistInfo(r.punchOutLatitude, r.punchOutLongitude, r.mode);
                  return (
                    <tr key={r._id} className="hover:bg-gray-50 text-xs h-[55px]">
                      <td className="px-3 py-2 font-medium text-black truncate max-w-[120px]">{r.employeeName || r.employeeId}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 font-bold rounded-full bg-indigo-100 text-[10px] text-black">
                          {getModeLabel(r.mode)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-black font-semibold">{formatTime(r.punchInTime)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{inD.branch}</span>
                          <span className={`${inD.className} text-[10px]`}>{inD.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-black font-semibold">{formatTime(r.punchOutTime)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{outD.branch}</span>
                          <span className={`${outD.className} text-[10px]`}>{outD.label}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 font-semibold rounded-full text-[10px] whitespace-nowrap ${getStatusBadgeClass(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-black">
            <Clock />
            <p className="mt-2">No records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRecords;