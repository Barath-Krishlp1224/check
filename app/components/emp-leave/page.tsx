"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  History,
  CalendarDays,
  Plus,
  X,
  Activity,
  Target,
  UserCheck,
  TrendingUp,
  Calendar,
  Filter,
  Cake,
  PartyPopper
} from "lucide-react";

const TOTAL_LIMIT = 12;
const TOTAL_WORK_DAYS = 320;

const formatTime = (timeStr?: string) => {
  if (!timeStr) return "--:--";
  return new Date(timeStr).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const LeaveForm = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState({ sick: 12, casual: 12, plannedRequests: 0, unplannedRequests: 0 });
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [birthdayEmployees, setBirthdayEmployees] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [empIdOrEmail, setEmpIdOrEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("Loading...");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isMyBirthday = useMemo(() => {
    return birthdayEmployees.some(
      (emp) => emp.name === employeeName || emp.displayName === employeeName || emp.empId === empIdOrEmail
    );
  }, [birthdayEmployees, employeeName, empIdOrEmail]);

  const refreshData = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const balanceRes = await fetch(`/api/leaves?empIdOrEmail=${encodeURIComponent(id)}`);
      if (balanceRes.ok) setSummary(await balanceRes.json());

      const historyRes = await fetch(`/api/leaves?empIdOrEmail=${encodeURIComponent(id)}&mode=list`);
      const historyData = await historyRes.json();
      if (Array.isArray(historyData)) setUserRequests(historyData);

      const attendanceRes = await fetch(`/api/attendance?empId=${encodeURIComponent(id)}`);
      if (attendanceRes.ok) {
        const attData = await attendanceRes.json();
        setAttendanceList(attData.attendances || []);
      }

      const birthdayRes = await fetch(`/api/employees?birthdays=true`);
      if (birthdayRes.ok) {
        const bData = await birthdayRes.json();
        if (bData.success) setBirthdayEmployees(bData.birthdays);
      }
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("userEmpId");
    const name = localStorage.getItem("userName");
    if (id) { 
      setEmpIdOrEmail(id); 
      setEmployeeName(name || id); 
      setIsLoggedIn(true);
      refreshData(id);
    }
  }, [refreshData]);

  const filteredAttendance = useMemo(() => {
    let filtered = attendanceList;
    if (selectedMonth !== "all") {
      filtered = attendanceList.filter((att) => {
        const attDate = new Date(att.date);
        const monthYear = `${attDate.getFullYear()}-${String(attDate.getMonth() + 1).padStart(2, '0')}`;
        return monthYear === selectedMonth;
      });
    }
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendanceList, selectedMonth]);

  const sortedRequests = useMemo(() => {
    return [...userRequests].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [userRequests]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    attendanceList.forEach(att => {
      const d = new Date(att.date);
      months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [attendanceList]);

  const annualStats = useMemo(() => {
    const totalApproved = userRequests
      .filter(req => req.status === 'approved' || req.status === 'auto-approved')
      .reduce((acc, req) => acc + req.days, 0);
    const presentCount = attendanceList.filter(a => a.present).length;

    return {
      totalTaken: totalApproved,
      presentCount,
      sickTaken: TOTAL_LIMIT - summary.sick,
      casualTaken: TOTAL_LIMIT - summary.casual,
      attendanceProgress: (presentCount / TOTAL_WORK_DAYS) * 100,
      leaveImpact: (totalApproved / TOTAL_WORK_DAYS) * 100
    };
  }, [summary, userRequests, attendanceList]);

  if (!isLoggedIn) return <div className="p-20 text-center font-bold text-black italic">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {employeeName[0]}
            </div>
            <div className="flex flex-col gap-1">
              <div>
                <h1 className="text-xl font-bold text-black leading-tight">{employeeName}</h1>
                <p className="text-xs text-black font-bold opacity-60 tracking-wider">ID: {empIdOrEmail}</p>
              </div>
              {birthdayEmployees.length > 0 && (
                <div className={`flex items-center gap-2 py-0.5 transition-all ${isMyBirthday ? 'text-pink-600' : 'text-blue-600'}`}>
                  {isMyBirthday ? <PartyPopper className="w-4 h-4" /> : <Cake className="w-4 h-4" />}
                  <span className="text-sm font-black italic">
                    {isMyBirthday 
                      ? `Happy Birthday to you, ${employeeName}! 🥳` 
                      : `Today's Birthday: ${birthdayEmployees.map(e => e.displayName || e.name).join(", ")} 🎂`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all self-center"
          >
            <Plus className="w-4 h-4" /> Request Leave
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatBox icon={<UserCheck className="text-blue-600" />} label="Presence" val={annualStats.presentCount} sub={`/ ${TOTAL_WORK_DAYS} Days`} progress={annualStats.attendanceProgress} color="bg-blue-600" />
          <StatBox icon={<Activity className="text-indigo-600" />} label="Sick" val={summary.sick} sub={`Taken: ${annualStats.sickTaken}`} progress={(summary.sick/TOTAL_LIMIT)*100} color="bg-indigo-600" />
          <StatBox icon={<CalendarDays className="text-purple-600" />} label="Casual" val={summary.casual} sub={`Taken: ${annualStats.casualTaken}`} progress={(summary.casual/TOTAL_LIMIT)*100} color="bg-purple-600" />
          <StatBox icon={<TrendingUp className="text-red-600" />} label="Total Taken" val={annualStats.totalTaken} sub="Leaves (All)" progress={annualStats.leaveImpact} color="bg-red-600" />
          <StatBox icon={<Target className="text-orange-600" />} label="Impact" val={annualStats.totalTaken} sub={`/ ${TOTAL_WORK_DAYS} Days`} progress={annualStats.leaveImpact} color="bg-orange-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="font-bold text-black flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" /> Attendance History
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-black" />
                <select 
                  className="text-xs border border-gray-300 rounded-lg p-1.5 outline-none bg-white font-black text-black"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="all">All Months</option>
                  {monthOptions.map(m => (
                    <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] uppercase text-black font-black sticky top-0 bg-white shadow-sm">
                  <tr>
                    <th className="p-5">Date</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Mode</th>
                    <th className="p-5">Punch In</th>
                    <th className="p-5">Punch Out</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredAttendance.map((att, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-5 font-bold text-black whitespace-nowrap">{new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${att.present ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {att.present ? "PRESENT" : "ABSENT"}
                        </span>
                      </td>
                      <td className="p-5 text-black font-bold capitalize">{att.mode?.toLowerCase().replace('_', ' ') || "Office"}</td>
                      <td className="p-5 font-bold text-emerald-700">{formatTime(att.punchInTime)}</td>
                      <td className="p-5 font-bold text-red-600">{formatTime(att.punchOutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[500px] lg:col-span-1">
            <div className="p-5 border-b border-gray-100 font-bold text-black flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" /> Leave History
            </div>
            <div className="p-4 space-y-3 overflow-auto flex-1">
              {sortedRequests.map((req, i) => (
                <div key={i} className="p-4 bg-white rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-black capitalize text-sm">{req.leaveType}</p>
                    <span className="text-xs font-black text-blue-700">{req.days} Days</span>
                  </div>
                  <p className="text-[10px] text-black font-black mb-2">{new Date(req.startDate).toLocaleDateString()}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${req.status.includes('app') ? 'text-emerald-700' : 'text-amber-700'}`}>{req.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">Apply Leave</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-black" /></button>
            </div>
            <div className="space-y-4">
              <select className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none text-black font-bold" value={leaveType} onChange={(e)=>setLeaveType(e.target.value)}>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="planned">Planned Leave</option>
                <option value="unplanned">Unplanned Leave</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-bold" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                <input type="date" className="p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-black font-bold" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
              </div>
              <textarea placeholder="Reason..." className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl h-24 resize-none text-black font-bold" value={description} onChange={(e)=>setDescription(e.target.value)} />
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ icon, label, val, sub, progress, color }: any) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-transform hover:scale-[1.02]">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">{icon}</div>
      <span className="text-[10px] font-black text-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="space-y-3">
      <h3 className="text-3xl font-black text-black">{val}</h3>
      <p className="text-[10px] text-black font-black uppercase">{sub}</p>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  </div>
);

export default LeaveForm;