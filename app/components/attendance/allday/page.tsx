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
  Download,
  RefreshCw,
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

const getDateKey = (value?: string) => {
  if (!value) return "";
  return value.slice(0, 10);
};

const App: React.FC = () => {
  const todayDateString = getTodayDateString();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<AttendanceMode | "ALL">("ALL");
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
      setAttendanceError("Failed to load attendance records.");
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load employees");

      const list: Employee[] = (json.employees || [])
        .map((emp: any) => ({
          employeeId: emp.empId,
          employeeName: emp.name,
          department: emp.department ?? emp.departmentName ?? emp.department_name ?? null,
          role: emp.role ?? null,
          team: emp.team ?? null,
          category: emp.category ?? null,
        }))
        .filter((emp: Employee) => emp.employeeId);

      setEmployees(list);
    } catch (error) {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
    loadEmployees();
  }, [loadAttendance, loadEmployees]);

  const formatDate = (value?: string) => {
    const key = getDateKey(value);
    if (!key) return "-";
    const [year, month, day] = key.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getDuration = (record: AttendanceRecord) => {
    if (!record.punchInTime || !record.punchOutTime) return "-";
    const start = new Date(record.punchInTime);
    const end = new Date(record.punchOutTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return "-";
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours <= 0 ? `${minutes} min` : `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  };

  const getStatusLabel = (record: AttendanceRecord): string => {
    const { punchInTime, punchOutTime, date } = record;
    const recordDateKey = getDateKey(date);
    if (!punchInTime && !punchOutTime) return "Absent";

    const refDate = new Date(`${recordDateKey}T00:00:00`);
    const login935 = new Date(refDate).setHours(9, 35, 0, 0);
    const login930 = new Date(refDate).setHours(9, 30, 0, 0);
    const logout1830 = new Date(refDate).setHours(18, 30, 0, 0);

    const getNorm = (t: string | null | undefined) => {
      if (!t) return null;
      const pt = new Date(t);
      const n = new Date(refDate);
      n.setHours(pt.getHours(), pt.getMinutes(), pt.getSeconds());
      return n.getTime();
    };

    const pIn = getNorm(punchInTime);
    const pOut = getNorm(punchOutTime);
    const parts: string[] = [];

    if (!pIn && pOut) parts.push("No Login");
    else if (pIn) {
      if (pIn > login935) parts.push("Late Login");
      else if (pIn >= login930) parts.push("Grace Login");
      else parts.push("On Time Login");
    }

    if (!pOut && pIn) parts.push("No Logout");
    else if (pOut) {
      if (pOut < logout1830) parts.push("Early Logout");
      else parts.push("On Time Logout");
    }

    return parts.join(" | ");
  };

  const getStatusBadgeClass = (label: string) => {
    if (label.includes("Absent") || label.includes("No Login")) return "bg-red-100 text-red-800";
    if (label.includes("Late Login")) return "bg-orange-100 text-orange-800";
    if (label.includes("Grace Login")) return "bg-blue-100 text-blue-800";
    if (label.includes("On Time")) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  const getModeLabel = (mode?: AttendanceMode) => {
    const m = mode || "IN_OFFICE";
    return m.replace(/_/g, " ").toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' ');
  };

  const getModeBadgeClass = (mode?: AttendanceMode) => {
    const m = mode || "IN_OFFICE";
    switch (m) {
      case "IN_OFFICE": return "bg-blue-50 text-blue-700 border border-blue-200";
      case "WORK_FROM_HOME": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "ON_DUTY": return "bg-orange-50 text-orange-700 border border-orange-200";
      case "REGULARIZATION": return "bg-slate-50 text-slate-700 border border-slate-200";
      default: return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const uniqueEmployees = useMemo(() => {
    if (employees.length > 0) return [...employees].sort((a, b) => (a.employeeName || "").localeCompare(b.employeeName || ""));
    const map = new Map();
    attendance.forEach(r => map.set(r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName || r.employeeId }));
    return Array.from(map.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [employees, attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      if (selectedEmployeeId !== "ALL" && r.employeeId !== selectedEmployeeId) return false;
      if (selectedMode !== "ALL" && (r.mode || "IN_OFFICE") !== selectedMode) return false;
      const d = getDateKey(r.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    });
  }, [attendance, selectedEmployeeId, selectedMode, fromDate, toDate]);

  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const onTime = filteredAttendance.filter(r => getStatusLabel(r).includes("On Time Login")).length;
    const late = filteredAttendance.filter(r => getStatusLabel(r).includes("Late Login")).length;
    const grace = filteredAttendance.filter(r => getStatusLabel(r).includes("Grace Login")).length;
    let absent = 0;

    const staff = employees.filter(e => !(`${e.role}${e.category}${e.team}`.toLowerCase().includes("founder")));
    const checkList = selectedEmployeeId === "ALL" ? staff : staff.filter(e => e.employeeId === selectedEmployeeId);

    checkList.forEach(emp => {
      const records = filteredAttendance.filter(r => r.employeeId === emp.employeeId);
      if (records.length === 0 || records.every(r => getStatusLabel(r).includes("Absent"))) absent += 1;
    });

    return { total, onTime, late, grace, absent, totalStaff: staff.length };
  }, [filteredAttendance, employees, selectedEmployeeId]);

  const handleExport = () => {
    if (filteredAttendance.length === 0) return alert("No records to export.");
    const header = "Employee,ID,Mode,Date,In,Out,Duration,Status\n";
    const rows = filteredAttendance.map(r => [
      `"${r.employeeName || r.employeeId}"`, r.employeeId, getModeLabel(r.mode), formatDate(r.date),
      formatTime(r.punchInTime), formatTime(r.punchOutTime), getDuration(r), `"${getStatusLabel(r)}"`
    ].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${formatDate(fromDate)}_to_${formatDate(toDate)}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <div className="mb-10">
          <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">Attendance Management</h1>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 p-8 mb-8">
          <div className="flex flex-wrap items-end justify-center gap-6">
            <div className="min-w-[200px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                <option value="ALL">All Staff</option>
                {uniqueEmployees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.employeeName}</option>)}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Mode</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={selectedMode} onChange={(e) => setSelectedMode(e.target.value as any)}>
                <option value="ALL">All Modes</option>
                <option value="IN_OFFICE">In Office</option>
                <option value="WORK_FROM_HOME">WFH</option>
                <option value="ON_DUTY">On Duty</option>
                <option value="REGULARIZATION">Regularization</option>
              </select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">From</label>
              <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">To</label>
              <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={loadAttendance} className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all"><RefreshCw className={`w-5 h-5 ${loadingAttendance ? 'animate-spin' : ''}`} /></button>
              <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"><Download className="w-4 h-4" /> Export</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Staff', val: stats.totalStaff, color: 'text-slate-900', border: 'border-b-slate-400' },
            { label: 'Records', val: stats.total, color: 'text-blue-900', border: 'border-b-blue-400' },
            { label: 'On Time', val: stats.onTime, color: 'text-green-600', border: 'border-b-green-500' },
            { label: 'Grace', val: stats.grace, color: 'text-blue-600', border: 'border-b-blue-500' },
            { label: 'Late', val: stats.late, color: 'text-orange-600', border: 'border-b-orange-500' },
            { label: 'Absent', val: stats.absent, color: 'text-red-600', border: 'border-b-red-500' }
          ].map((s, i) => (
            <div key={i} className={`bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm transition-transform hover:-translate-y-1 ${s.border || ''}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {loadingAttendance ? (
            <div className="py-32 flex flex-col items-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" /><p className="font-bold text-slate-400">Loading records...</p></div>
          ) : filteredAttendance.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '275px' }}>
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-slate-100">
                  <tr>
                    {['Employee', 'ID', 'Mode', 'Date', 'In', 'Out', 'Duration', 'Status'].map((h, idx) => (
                      <th key={h} className={`px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest ${idx === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.map(r => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors h-[70px]">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-[10px] font-bold">{r.employeeName?.charAt(0)}</div><span className="text-sm font-bold text-slate-800">{r.employeeName}</span></div></td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400 text-center">{r.employeeId}</td>
                      <td className="px-6 py-4 text-center"><span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${getModeBadgeClass(r.mode)}`}>{getModeLabel(r.mode)}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 text-center">{formatDate(r.date)}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-700 text-center">{formatTime(r.punchInTime)}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-700 text-center">{formatTime(r.punchOutTime)}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900 text-center">{getDuration(r)}</td>
                      <td className="px-6 py-4 text-center"><span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase ${getStatusBadgeClass(getStatusLabel(r))}`}>{getStatusLabel(r)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Clock className="w-8 h-8 text-slate-300" /></div>
              <p className="font-bold text-slate-800">No records found</p>
              <p className="text-sm text-slate-400">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;