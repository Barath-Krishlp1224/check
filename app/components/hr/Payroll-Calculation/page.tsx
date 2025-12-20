"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  ChevronLeft,
  Award,
  X,
  Target,
  Calendar,
  Star,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Employee = {
  _id: string;
  name: string;
  role?: string;
  team?: string;
  empId?: string;
  employeeId?: string;
};

type Task = {
  assigneeNames: string[];
  status?: string;
  completion?: number;
  subtasks?: Array<{
    completion?: number;
    subtasks?: any[];
  }>;
};

type Attendance = {
  employeeId: string;
  present: boolean;
  date?: string;
};

type Score = {
  employeeId: string;
  name: string;
  team: string;
  taskScore: number;
  attendanceScore: number;
  otherScore: number;
  total: number;
  taskCount: number;
  avgCompletion: number;
  attendanceCount: number;
  presentCount: number;
};

const TOTAL_WORKING_DAYS = 300;

const TEAM_OPTIONS = [
  "Manager", "TL-Reporting Manager", "HR", "Tech", "IT Admin", 
  "Accounts", "Admin & Operations", "Housekeeping", "TL Accountant",
];

const getHikeCategory = (score: number) => {
  if (score >= 95) return { category: "Outstanding", hikeRange: "18–20%", color: "emerald" };
  if (score >= 90) return { category: "Excellent", hikeRange: "15–17%", color: "green" };
  if (score >= 80) return { category: "Very Good", hikeRange: "10–14%", color: "blue" };
  if (score >= 70) return { category: "Good", hikeRange: "6–9%", color: "indigo" };
  if (score >= 60) return { category: "Developing", hikeRange: "3–5%", color: "yellow" };
  if (score >= 50) return { category: "Below Expected", hikeRange: "1–2%", color: "orange" };
  return { category: "Underperforming", hikeRange: "0%", color: "red" };
};

const calculateTaskCompletion = (task: Task): number => {
  if (typeof task.completion === "number" && task.completion > 0) return task.completion;
  if (!task.subtasks || task.subtasks.length === 0) return 0;
  const calc = (subs: any[]): number => {
    let total = 0, count = 0;
    subs.forEach((s) => {
      total += typeof s.completion === "number" ? s.completion : 0;
      count++;
      if (s.subtasks?.length) {
        const nested = calc(s.subtasks);
        total += nested * s.subtasks.length;
        count += s.subtasks.length;
      }
    });
    return count > 0 ? total / count : 0;
  };
  return Math.round(calc(task.subtasks));
};

function BehaviorComponent({ 
  employeeId, 
  employeeName, 
  onClose, 
  onSave 
}: { 
  employeeId: string; 
  employeeName: string; 
  onClose: () => void; 
  onSave: (score: number) => void;
}) {
  const [formData, setFormData] = useState({
    punctuality: 5,
    teamwork: 5,
    communication: 5,
    initiative: 5,
    professionalism: 5,
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const behaviorScore = Math.round(
    ((formData.punctuality + formData.teamwork + formData.communication + 
      formData.initiative + formData.professionalism) / 25) * 100
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/metrics/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          employeeName,
          formData: { ...formData, behaviorScore }
        })
      });
      const data = await response.json();
      if (data.success) {
        onSave(behaviorScore);
        onClose();
      } else {
        setError(data.error || "Failed to save behavior metrics");
      }
    } catch (err) {
      setError("Failed to save behavior metrics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{employeeName}</h3>
          <p className="text-sm text-gray-600 mt-1">Behavior Assessment</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} className="text-gray-600" />
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-6 mb-6">
        {[
          { key: "punctuality", label: "Punctuality & Time Management" },
          { key: "teamwork", label: "Teamwork & Collaboration" },
          { key: "communication", label: "Communication Skills" },
          { key: "initiative", label: "Initiative & Proactivity" },
          { key: "professionalism", label: "Professionalism & Work Ethics" }
        ].map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">{label}</label>
              <span className="text-sm font-bold text-gray-800">{formData[key as keyof typeof formData]}/5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={formData[key as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [key]: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-700"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            rows={3}
          />
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">Calculated Behavior Score</span>
          <span className="text-3xl font-bold text-gray-800">{behaviorScore}%</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold">Cancel</button>
        <button onClick={handleSubmit} disabled={loading} className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold disabled:opacity-50">
          {loading ? "Saving..." : "Save Assessment"}
        </button>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Score | null>(null);
  const [behaviorTarget, setBehaviorTarget] = useState<Score | null>(null);
  const [daysFilter, setDaysFilter] = useState<number | null>(null);
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [currentWorkingDays, setCurrentWorkingDays] = useState(TOTAL_WORKING_DAYS);

  const handleBehaviorUpdate = (newScore: number) => {
    if (!behaviorTarget) return;
    setScores((prevScores) => {
      return prevScores.map((s) => {
        if (s.employeeId === behaviorTarget.employeeId) {
          const updatedTotal = Math.round((s.taskScore + s.attendanceScore + newScore) / 3);
          const updatedEmployee = { ...s, otherScore: newScore, total: updatedTotal };
          if (selectedEmployee?.employeeId === s.employeeId) setSelectedEmployee(updatedEmployee);
          return updatedEmployee;
        }
        return s;
      });
    });
    setBehaviorTarget(null);
  };

  const loadData = async (isCustom = false) => {
    setLoading(true);
    try {
      let query = "";
      let calculatedWorkingDays = TOTAL_WORKING_DAYS;
      if (isCustom && customRange.from && customRange.to) {
        query = `?from=${customRange.from}&to=${customRange.to}`;
        const start = new Date(customRange.from);
        const end = new Date(customRange.to);
        calculatedWorkingDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else if (daysFilter) {
        query = `?days=${daysFilter}`;
        calculatedWorkingDays = daysFilter;
      }
      setCurrentWorkingDays(calculatedWorkingDays);
      const [empRes, taskRes, attRes, behaviorRes] = await Promise.all([
        fetch("/api/employees/get/all"),
        fetch(`/api/tasks${query}`),
        fetch(`/api/attendance${query}`),
        fetch("/api/metrics/behavior")
      ]);
      const empJson = await empRes.json();
      const taskJson = await taskRes.json();
      const attJson = await attRes.json();
      const behaviorJson = await behaviorRes.json();
      const filteredEmployees = (empJson.employees || []).filter((e: Employee) => e.role?.toLowerCase() !== "founder");
      const calculated: Score[] = filteredEmployees.map((emp: Employee) => {
        const empTasks = (taskJson.tasks || []).filter((t: Task) => 
          t.assigneeNames?.some((n) => n.toLowerCase() === emp.name.toLowerCase())
        );
        const avgCompletion = empTasks.length > 0 
          ? Math.round(empTasks.reduce((s: number, t: Task) => s + calculateTaskCompletion(t), 0) / empTasks.length) 
          : 0;
        const empCode = emp.empId || emp.employeeId;
        const empAtt = (attJson.attendances || []).filter((a: Attendance) => a.employeeId === empCode);
        const present = empAtt.filter((a: Attendance) => a.present).length;
        const attendanceScore = Math.round((present / calculatedWorkingDays) * 100);
        const behaviorData = Array.isArray(behaviorJson) ? behaviorJson.find((b: any) => b.employeeId === emp._id) : null;
        const otherScore = behaviorData ? behaviorData.score : 100;
        const total = Math.round((avgCompletion + attendanceScore + otherScore) / 3);
        return {
          employeeId: emp._id,
          name: emp.name,
          team: emp.team || "Unassigned",
          taskScore: avgCompletion,
          attendanceScore,
          otherScore,
          total,
          taskCount: empTasks.length,
          avgCompletion,
          attendanceCount: empAtt.length,
          presentCount: present,
        };
      });
      setScores(calculated);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (!customRange.from) loadData(); 
  }, [daysFilter]);

  const { qualified, underperforming } = useMemo(() => {
    if (!selectedTeam) return { qualified: [], underperforming: [] };
    const filtered = scores.filter((s) => s.team === selectedTeam);
    return {
      qualified: filtered.filter(s => s.total > 50).sort((a,b) => b.total - a.total),
      underperforming: filtered.filter(s => s.total <= 50).sort((a,b) => b.total - a.total)
    };
  }, [selectedTeam, scores]);

  const EmployeeRow = ({ s, index }: { s: Score, index: number }) => (
    <tr key={s.employeeId} className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4 text-center font-mono text-xs font-semibold text-gray-500">
        {(index + 1).toString().padStart(2, '0')}
      </td>
      <td className="px-6 py-4" onClick={() => setSelectedEmployee(s)}>
        <div className="cursor-pointer">
          <span className="font-semibold text-gray-800 text-xs">{s.name}</span>
        </div>
      </td>
      <td className="px-2 py-4 text-center font-semibold text-gray-600 text-xs">{s.taskScore}%</td>
      <td className="px-2 py-4 text-center font-semibold text-gray-600 text-xs">{s.attendanceScore}%</td>
      <td className="px-2 py-4 text-center text-xs font-bold text-gray-800">{s.total}%</td>
      <td className="px-6 py-4 text-center">
        <button 
          onClick={(e) => { e.stopPropagation(); setBehaviorTarget(s); }}
          className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all shadow-md"
        >
          <Star size={12} className={s.otherScore !== 100 ? "fill-yellow-400 text-yellow-400" : ""} />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-gray-800">
      <AnimatePresence>
        {behaviorTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBehaviorTarget(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <BehaviorComponent 
                key={behaviorTarget.employeeId}
                employeeId={behaviorTarget.employeeId} 
                employeeName={behaviorTarget.name} 
                onClose={() => setBehaviorTarget(null)}
                onSave={handleBehaviorUpdate} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmployee(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh]">
              <button onClick={() => setSelectedEmployee(null)} className="absolute top-5 right-5 p-2.5 hover:bg-gray-100 rounded-full z-10 transition-all">
                <X size={20} className="text-gray-600" />
              </button>
              <div className="bg-gray-800 p-8 md:p-10">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{selectedEmployee.name}</h2>
                    <p className="text-gray-300 text-sm font-medium uppercase tracking-widest">{selectedEmployee.team}</p>
                  </div>
                </div>
              </div>
              <div className="p-8 md:p-10 overflow-y-auto max-h-[calc(85vh-160px)]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                  {[
                    { label: "Task Performance", val: selectedEmployee.taskScore, icon: <Target size={18}/>, desc: `${selectedEmployee.taskCount} Total Tasks` },
                    { label: "Attendance", val: selectedEmployee.attendanceScore, icon: <Calendar size={18}/>, desc: `${selectedEmployee.presentCount} / ${currentWorkingDays} Days Present` },
                    { label: "Behavior", val: selectedEmployee.otherScore, icon: <Star size={18}/>, desc: "Peer Assessment" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-600">{item.icon}</div>
                        <span className="text-xs font-bold text-gray-500 uppercase">{item.label}</span>
                        <span className="ml-auto text-xl font-bold text-gray-800">{item.val}%</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-600 mb-3">{item.desc}</p>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.val}%` }} transition={{ duration: 1 }} className="bg-gray-800 h-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                  <div className="md:col-span-2 bg-gray-800 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Aggregate Score</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-bold text-white">{selectedEmployee.total}</span>
                      <span className="text-xl text-gray-400">/100</span>
                    </div>
                  </div>
                  <div className="md:col-span-3 bg-white border border-gray-200 rounded-2xl p-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Salary Hike Recommendation</p>
                    <div className="text-3xl font-bold text-gray-800">{getHikeCategory(selectedEmployee.total).hikeRange}</div>
                    <p className="text-sm font-bold text-gray-600 uppercase mt-1">{getHikeCategory(selectedEmployee.total).category}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-[1400px] flex flex-col items-center">
        <div className="w-full mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-5">
            <div className="bg-gray-800 p-4 rounded-3xl shadow-xl"><Award className="text-white" size={28} /></div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{selectedTeam || "Performance Dashboard"}</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Reviewing {currentWorkingDays} Operational Days</p>
            </div>
          </div>
          {selectedTeam && (
            <button onClick={() => setSelectedTeam(null)} className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
              <ChevronLeft size={16} /> Dashboard
            </button>
          )}
        </div>
        {!selectedTeam ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full px-4 place-items-center">
            {TEAM_OPTIONS.map((team) => (
              <div key={team} onClick={() => setSelectedTeam(team)} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:translate-y-[-4px] transition-all group active:scale-95 w-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-gray-800 transition-colors"><Users className="text-slate-400 group-hover:text-white" size={22} /></div>
                  <span className="text-2xl font-black text-gray-300 group-hover:text-gray-800 transition-colors">{scores.filter(s => s.team === team).length}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{team}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 px-4 w-full justify-center">
            <div className="flex-1 max-w-[600px]">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-gray-600" size={20} />
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Need Improvement (≤50%)</h2>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500">S.No</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500">Name</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-500 text-center">Tsk</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-500 text-center">Att</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-500 text-center">Score</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-500 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {underperforming.length > 0 ? underperforming.map((s, i) => (
                      <EmployeeRow key={s.employeeId} s={s} index={i} />
                    )) : (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-500 text-sm italic">All team members are above 50%</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex-1 max-w-[600px]">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="text-gray-600" size={20} />
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Top Performers ({'>'}50%)</h2>
              </div>
              <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden ring-1 ring-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-600">S.No</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-600">Name</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-600 text-center">Tsk</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-600 text-center">Att</th>
                      <th className="px-2 py-4 text-[10px] font-bold uppercase text-gray-600 text-center">Score</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-600 text-center">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {qualified.length > 0 ? qualified.map((s, i) => (
                      <EmployeeRow key={s.employeeId} s={s} index={i} />
                    )) : (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-500 text-sm italic">No high performers recorded yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}