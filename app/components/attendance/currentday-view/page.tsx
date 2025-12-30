"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Loader2, Clock } from "lucide-react";

type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

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
  punchInBranch?: string | null; 
  punchOutBranch?: string | null; 
}

const AttendanceRecords: React.FC = () => {
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const todayDateKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoaded(true);
    const loadAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const res = await fetch("/api/attendance/all", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load records.");
        setAllAttendance(json.records || []);
      } catch (error) {
        console.error("Failed to load attendance records.");
      } finally {
        setLoadingAttendance(false);
      }
    };
    loadAttendance();
  }, []);

  const todayAttendance = useMemo(() => 
    allAttendance.filter(r => r.date?.slice(0, 10) === todayDateKey), 
  [allAttendance, todayDateKey]);

  const formatTime = (v?: string | null) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "-" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getStatusBadgeClass = (punchIn?: string | null) => {
    if (!punchIn) return "bg-red-100 text-red-700 border-red-200";
    const p = new Date(punchIn);
    // Grace time: 9:35 AM
    const graceTime = new Date(p).setHours(9, 35, 0, 0);
    return p.getTime() > graceTime ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className={`p-4 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      {/* Header Section */}
      <div className="mb-6 flex items-center gap-3 bg-white w-fit px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Today's Attendance</h2>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {loadingAttendance ? (
          <div className="flex flex-col items-center justify-center h-[285px]">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
          </div>
        ) : todayAttendance.length > 0 ? (
          /* Height logic: 
             Header (approx 50px) + 3 Rows (70px * 3 = 210px) + minor padding = ~285px 
          */
          <div className="overflow-x-auto overflow-y-auto h-[285px] scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {["Employee", "Mode", "Punch In", "In Branch", "Punch Out", "Out Branch", "Status"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {todayAttendance.map(r => (
                  <tr key={r._id} className="hover:bg-blue-50/30 transition-colors h-[70px]">
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{r.employeeName || "Unknown"}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold whitespace-nowrap">
                        {r.mode?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-600 whitespace-nowrap">{formatTime(r.punchInTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-800 uppercase leading-none">{r.punchInBranch || "N/A"}</span>
                        <span className="text-[9px] text-gray-400 mt-1">Captured</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-orange-600 whitespace-nowrap">{formatTime(r.punchOutTime)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-800 uppercase leading-none">{r.punchOutBranch || "N/A"}</span>
                        <span className="text-[9px] text-gray-400 mt-1">Captured</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusBadgeClass(r.punchInTime)}`}>
                        {r.punchInTime ? (
                          (new Date(r.punchInTime).getHours() >= 9 && new Date(r.punchInTime).getMinutes() > 35) ? "LATE" : "PRESENT"
                        ) : "ABSENT"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[285px]">
            <Clock className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-400 font-bold">No logs found for today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceRecords;