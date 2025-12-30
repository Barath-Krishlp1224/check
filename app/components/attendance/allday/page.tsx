"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, Clock, Download, RefreshCw } from "lucide-react";

type AttendanceMode = "IN_OFFICE" | "WORK_FROM_HOME" | "ON_DUTY" | "REGULARIZATION";

const BRANCHES = [
  { name: "Branch 1", lat: 11.939198361614558, lon: 79.81654494108358, radius: 100 },
  { name: "Branch 2", lat: 11.940000000000000, lon: 79.82000000000000, radius: 300 } 
];

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const getBranchValidation = (lat: number, lon: number) => {
  const calculations = BRANCHES.map(branch => {
    const dist = getDistanceMeters(lat, lon, branch.lat, branch.lon);
    return { distance: dist, isAllowed: dist <= branch.radius, branchName: branch.name };
  });
  return calculations.reduce((prev, curr) => (curr.distance < prev.distance ? curr : prev));
};

const App: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);

  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const res = await fetch("/api/attendance/all", { method: "GET", cache: "no-store" });
      const json = await res.json();
      if (res.ok) setAttendance(json.records || []);
    } catch (error) { setAttendance([]); } finally { setLoadingAttendance(false); }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees", { method: "GET", cache: "no-store" });
      const json = await res.json();
      if (res.ok) {
        setEmployees((json.employees || []).map((e: any) => ({
          employeeId: e.empId, employeeName: e.name, role: e.role || "", category: e.category || "", team: e.team || ""
        })));
      }
    } catch (error) { setEmployees([]); }
  }, []);

  useEffect(() => { loadAttendance(); loadEmployees(); }, [loadAttendance, loadEmployees]);

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getDuration = (inT?: string | null, outT?: string | null) => {
    if (!inT || !outT) return "-";
    const diff = new Date(outT).getTime() - new Date(inT).getTime();
    if (diff < 0) return "-";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  // Improved Logic: prioritize API branch field, then calculate from coordinates
  const getBranchDisplay = (r: any, type: 'in' | 'out') => {
    const branchField = type === 'in' ? r.punchInBranch : r.punchOutBranch;
    const lat = type === 'in' ? r.punchInLatitude : r.punchOutLatitude;
    const lon = type === 'in' ? r.punchInLongitude : r.punchOutLongitude;

    // 1. If API provides the branch name directly, use it
    if (branchField && branchField !== "N/A") return { name: branchField, dist: "", color: "text-slate-700" };

    // 2. If no coordinates, return N/A
    if (lat == null || lon == null) return { name: "N/A", dist: "", color: "text-slate-400" };

    // 3. Calculate based on Mode
    if (r.mode !== "IN_OFFICE") return { name: "REMOTE", dist: "", color: "text-blue-500" };

    // 4. Calculate based on GPS
    const validation = getBranchValidation(lat, lon);
    return { 
      name: validation.branchName, 
      dist: `${validation.distance}m`, 
      color: validation.isAllowed ? "text-green-600" : "text-red-600" 
    };
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      const matchesEmployee = selectedEmployeeId === "ALL" || r.employeeId === selectedEmployeeId;
      const recordDate = r.date.slice(0, 10);
      const matchesFromDate = !fromDate || recordDate >= fromDate;
      const matchesToDate = !toDate || recordDate <= toDate;
      return matchesEmployee && matchesFromDate && matchesToDate;
    });
  }, [attendance, selectedEmployeeId, fromDate, toDate]);

  const stats = useMemo(() => {
    const staff = employees.filter(e => !(`${e.role}${e.category}${e.team}`.toLowerCase().includes("founder")));
    const records = filteredAttendance.length;
    const onTime = filteredAttendance.filter(r => {
      if (!r.punchInTime) return false;
      const t = new Date(r.punchInTime);
      return (t.getHours() < 9) || (t.getHours() === 9 && t.getMinutes() < 30);
    }).length;
    const grace = filteredAttendance.filter(r => {
      if (!r.punchInTime) return false;
      const t = new Date(r.punchInTime);
      return (t.getHours() === 9 && t.getMinutes() >= 30 && t.getMinutes() <= 35);
    }).length;
    
    let absent = 0;
    const checkList = selectedEmployeeId === "ALL" ? staff : staff.filter(e => e.employeeId === selectedEmployeeId);
    checkList.forEach(emp => { 
      if (!filteredAttendance.some(r => r.employeeId === emp.employeeId)) absent += 1; 
    });

    return { totalStaff: staff.length, records, onTime, grace, late: records - (onTime + grace), absent };
  }, [filteredAttendance, employees, selectedEmployeeId]);

  const exportCSV = () => {
    const headers = "Employee,In Time,Out Time,Work Hours\n";
    const rows = filteredAttendance.map(r => `${r.employeeName},${formatTime(r.punchInTime)},${formatTime(r.punchOutTime)},${getDuration(r.punchInTime, r.punchOutTime)}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Attendance.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-black text-slate-900 mb-6 tracking-tight text-left uppercase">Attendance Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* FILTERS */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl p-6 flex flex-col justify-center space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Staff Member</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none" 
                value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                <option value="ALL">All Staff</option>
                {employees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.employeeName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">From</label>
                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">To</label>
                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={loadAttendance} className="p-3 bg-slate-50 border-2 border-slate-100 rounded-xl hover:bg-slate-100 transition-all flex-1 flex justify-center text-slate-600">
                <RefreshCw className={`w-5 h-5 ${loadingAttendance ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={exportCSV} className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Staff', val: stats.totalStaff, color: 'text-slate-900', border: 'border-l-slate-400' },
              { label: 'Records', val: stats.records, color: 'text-blue-900', border: 'border-l-blue-400' },
              { label: 'On Time', val: stats.onTime, color: 'text-green-600', border: 'border-l-green-500' },
              { label: 'Grace', val: stats.grace, color: 'text-blue-500', border: 'border-l-blue-400' },
              { label: 'Late', val: stats.late, color: 'text-orange-600', border: 'border-l-orange-500' },
              { label: 'Absent', val: stats.absent, color: 'text-red-600', border: 'border-l-red-500' }
            ].map((s, i) => (
              <div key={i} className={`bg-white px-4 py-4 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center border-l-4 ${s.border}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl overflow-hidden">
          {loadingAttendance ? (
            <div className="py-20 flex flex-col items-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '280px' }}>
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-slate-100">
                  <tr>
                    {['Employee', 'In Time', 'In Branch', 'Out Time', 'Out Branch', 'Hours'].map((h) => (
                      <th key={h} className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map(r => {
                      const inInfo = getBranchDisplay(r, 'in');
                      const outInfo = getBranchDisplay(r, 'out');
                      return (
                        <tr key={r._id} className="hover:bg-slate-50/50 h-[80px]">
                          <td className="px-5 py-3">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-800 line-clamp-1">{r.employeeName}</span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{r.mode?.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-slate-600 text-center">{formatTime(r.punchInTime)}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex flex-col">
                              <span className={`text-xs font-black uppercase ${inInfo.color}`}>{inInfo.name}</span>
                              {inInfo.dist && <span className="text-[9px] font-bold text-slate-400 mt-0.5">{inInfo.dist}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-slate-600 text-center">{formatTime(r.punchOutTime)}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex flex-col">
                              <span className={`text-xs font-black uppercase ${outInfo.color}`}>{outInfo.name}</span>
                              {outInfo.dist && <span className="text-[9px] font-bold text-slate-400 mt-0.5">{outInfo.dist}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-black">
                              {getDuration(r.punchInTime, r.punchOutTime)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <p className="font-bold text-slate-400 italic">No attendance records match your filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;