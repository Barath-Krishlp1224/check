"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { 
  LayoutGrid, 
  ListTodo, 
  BarChart2, 
  User, 
  X, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  List,
  Target,
  CheckCircle2,
  Clock,
  Zap,
  Award,
  Info,
  Timer
} from "lucide-react";
import { useRouter } from "next/navigation";
import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import TaskChartView from "./components/TaskChartView";

import {
  Task,
  Subtask,
  Employee,
} from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type ViewType = "card" | "board" | "chart";

const allTaskStatuses = [
  "Backlog", "In Progress", "Dev Review", "Deployed in QA",
  "Test In Progress", "QA Sign Off", "Deployment Stage",
  "Pilot Test", "Completed", "Paused",
];

// Helper to calculate task duration in days
const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} Days` : "1 Day";
};

const getPreviousWeek = (weekStr: string) => {
  if (!weekStr || !weekStr.includes("-W")) return "";
  const [year, week] = weekStr.split("-W").map(Number);
  if (week === 1) return `${year - 1}-W52`;
  return `${year}-W${String(week - 1).padStart(2, '0')}`;
};

const isDateInWeek = (dateStr?: string, weekStr?: string): boolean => {
  if (!dateStr || !weekStr || !weekStr.includes("-W")) return false;
  const [year, weekNum] = weekStr.split("-W").map(Number);
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return d.getUTCFullYear() === year && weekNo === weekNum;
};

const EmployeeStatsModal: React.FC<{
  emp: any;
  isOpen: boolean;
  onClose: () => void;
  week: string;
}> = ({ emp, isOpen, onClose, week }) => {
  if (!isOpen || !emp) return null;

  const trend = emp.percentage - emp.prevPercentage;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white text-black">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{emp.name}</h2>
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-slate-900" /> Individual Summary • {week}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-900">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-white">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 bg-[#3fa87d] rounded"><Zap className="w-3 h-3 text-white" /></span> Performance Metrics
                </h3>
                {emp.percentage >= 90 && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-white bg-[#3fa87d] px-2 py-1 rounded-full">
                        <Award className="w-3 h-3 text-white"/> TOP PERFORMER
                    </span>
                )}
            </div>
            <div className="grid grid-cols-3 gap-6 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Subtasks Handled</p>
                <p className="text-2xl font-black text-slate-900">{emp.taskCount}</p>
              </div>
              <div className="space-y-1 border-x border-slate-200 px-6">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Avg Completion</p>
                <p className="text-2xl font-black text-slate-900">{emp.percentage}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Weekly Trend</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-black ${trend >= 0 ? 'text-[#3fa87d]' : 'text-red-600'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                  {trend !== 0 && (
                    <span className="p-1 bg-slate-900 rounded">
                      {trend > 0 ? <TrendingUp className="w-3 h-3 text-white"/> : <TrendingDown className="w-3 h-3 text-white"/>}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-[10px] font-bold">
               <div className="text-slate-800 uppercase tracking-tight">Previous Week Performance: <span className="text-slate-900 font-black">{emp.prevPercentage}%</span></div>
               <div className={`px-2 py-0.5 rounded text-white ${trend >= 0 ? 'bg-[#3fa87d]' : 'bg-red-600'}`}>
                   {trend >= 0 ? 'GROWTH' : 'STABLE'}
               </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
              <span className="p-1 bg-slate-900 rounded"><CalendarDays className="w-3 h-3 text-white" /></span> Daily Work Pulse
            </h3>
            <div className="flex justify-between gap-2">
              {days.map((day, idx) => {
                const dayData = emp.dailyCompletion[idx + 1] || 0;
                const isPresent = dayData > 0;
                return (
                  <div key={day} className="flex-1 text-center">
                    <div className={`aspect-square rounded-xl flex items-center justify-center mb-2 border-2 transition-all ${isPresent ? 'bg-green-50 border-[#3fa87d] text-[#3fa87d]' : 'bg-red-50 border-red-500 text-red-700'}`}>
                      <span className="text-xs font-black">{isPresent ? `${dayData}%` : 'ABS'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 uppercase">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
              <span className="p-1 bg-slate-900 rounded"><List className="w-3 h-3 text-white" /></span> Detailed Work Log
            </h3>
            <div className="space-y-3">
               {emp.items && emp.items.length > 0 ? emp.items.map((item: any, idx: number) => (
                 <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-slate-400 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                              <span className="p-0.5 bg-slate-900 rounded"><Target className="w-2.5 h-2.5 text-white"/></span> {item.parentTask}
                           </div>
                           <div className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase">
                              {item.parentStatus}
                           </div>
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{item.title}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-xs font-black text-white bg-[#3fa87d] px-2 py-1 rounded-lg shadow-md">
                          {item.completion}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-800 font-bold uppercase">
                       <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-slate-900"/> {item.date}</span>
                       <span className={`italic font-black flex items-center gap-1 ${item.status === 'Completed' ? 'text-[#3fa87d]' : 'text-amber-700'}`}>
                         <span className="p-0.5 bg-slate-900 rounded">
                           {item.status === 'Completed' ? <CheckCircle2 className="w-2.5 h-2.5 text-white"/> : <Clock className="w-2.5 h-2.5 text-white"/>}
                         </span>
                         {item.status || "Pending"}
                       </span>
                    </div>
                 </div>
               )) : (
                 <p className="text-center text-sm text-slate-800 py-6 italic font-medium">No tasks logged.</p>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false);
  const [viewType, setViewType] = useState<ViewType>("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [selectedEmpStats, setSelectedEmpStats] = useState<any | null>(null);

  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path}`;
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(getApiUrl("/api/tasks"));
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
    } catch (err) {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(getApiUrl("/api/employees"));
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch (err) {}
  };

  useEffect(() => {
    import("xlsx").then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
    }).catch(() => {});

    const init = async () => {
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setLoading(false);
    };
    const timer = setTimeout(() => setMinLoadTimePassed(true), 2000);
    init();
    return () => clearTimeout(timer);
  }, []);

  // Filter employees to only show those in the "Accounts" team
  const accountsEmployees = useMemo(() => 
    employees.filter((e) => {
        const team = (e as any).team?.toLowerCase?.();
        return team === "accounts";
    }), [employees]
  );

  // Filter tasks to only show those belonging to the "Accounts" department
  const visibleTasks = useMemo(() => 
    tasks.filter((task) => {
      const dept = (task.department || "").toLowerCase();
      return dept.includes("accounts");
    }), [tasks]
  );

  const filteredTasks = useMemo(() => {
    if (downloadFilterType === "all" || !downloadFilterValue) return visibleTasks;
    return visibleTasks.filter((task) => {
      switch (downloadFilterType) {
        case "project": return task.project.toLowerCase() === downloadFilterValue.toLowerCase();
        case "assignee": return downloadFilterValue === "all" ? true : task.assigneeNames?.some(a => a.toLowerCase() === downloadFilterValue.toLowerCase());
        case "status": return task.status.toLowerCase() === downloadFilterValue.toLowerCase();
        case "week": return isDateInWeek(task.startDate, downloadFilterValue);
        default: return true;
      }
    });
  }, [visibleTasks, downloadFilterType, downloadFilterValue]);

  const employeeStats = useMemo(() => {
    if (downloadFilterType !== "week" || !downloadFilterValue) return [];
    const prevWeek = getPreviousWeek(downloadFilterValue);

    return accountsEmployees.map(emp => {
      let currentItems: any[] = [];
      let currentSum = 0;
      let prevSum = 0;
      let prevCount = 0;
      let dailyCompletion: Record<number, number> = {};

      tasks.forEach((task: any) => {
        const parentTitle = task.title || task.project || "Main Task";
        const processSubs = (subs: Subtask[]) => {
          subs.forEach(s => {
            if (s.assigneeName === emp.name) {
              if (isDateInWeek(s.date, downloadFilterValue)) {
                currentItems.push({ 
                  title: s.title, 
                  parentTask: parentTitle,
                  completion: s.completion || 0, 
                  status: s.status,
                  date: s.date,
                  parentStatus: task.status
                });
                currentSum += (s.completion || 0);
                const day = new Date(s.date as string).getUTCDay();
                if (day >= 1 && day <= 5) dailyCompletion[day] = Math.max(dailyCompletion[day] || 0, s.completion || 0);
              }
              if (isDateInWeek(s.date, prevWeek)) {
                prevSum += (s.completion || 0);
                prevCount++;
              }
            }
            if (s.subtasks) processSubs(s.subtasks);
          });
        };
        if (task.subtasks) processSubs(task.subtasks);
      });

      const currentAvg = currentItems.length > 0 ? Math.round(currentSum / currentItems.length) : 0;
      const previousAvg = prevCount > 0 ? Math.round(prevSum / prevCount) : 0;

      return {
        ...emp,
        taskCount: currentItems.length,
        items: currentItems,
        dailyCompletion,
        percentage: currentAvg,
        prevPercentage: previousAvg,
        variance: currentAvg - previousAvg
      };
    });
  }, [tasks, accountsEmployees, downloadFilterType, downloadFilterValue]);

  const handleExcelDownload = useCallback(() => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Excel library is still loading...");
      return;
    }

    let finalData: any[] = [];
    let wscols: any[] = [];

    if (downloadFilterType === "week" && downloadFilterValue) {
      tasks.forEach((task: any) => {
        const parentTitle = task.title || task.project || "Main Task";
        const processSubs = (subs: Subtask[]) => {
          subs.forEach(s => {
            if (isDateInWeek(s.date, downloadFilterValue)) {
              finalData.push({
                "Date": s.date,
                "Employee Name": s.assigneeName || "Unassigned",
                "Subtask Title": s.title,
                "Completion %": s.completion,
                "Subtask Status": s.status,
                "Project Name": task.project,
                "Parent Task": parentTitle,
                "Parent Status": task.status
              });
            }
            if (s.subtasks) processSubs(s.subtasks);
          });
        };
        if (task.subtasks) processSubs(task.subtasks);
      });
      wscols = [{ wch: 12 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }];
    } else {
      finalData = filteredTasks.map((task: any) => {
        const aggregated = getAggregatedTaskData(task);
        return {
          "Project ID": task.projectId,
          "Project Name": task.project,
          "Main Task Title": task.title || task.project,
          "Task Status": task.status,
          "Completion %": aggregated.completion,
          "Assigned To": task.assigneeNames?.join(", ") || "Unassigned",
          "Start Date": task.startDate,
          "Due Date": task.dueDate,
          "Department": task.department
        };
      });
      wscols = [{ wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    }

    if (finalData.length === 0) {
      toast.info("No records match filters.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    worksheet["!cols"] = wscols;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resource Report");
    XLSX.writeFile(workbook, `Report_${downloadFilterValue || 'Data'}.xlsx`);
    toast.success("Excel report exported!");
  }, [tasks, filteredTasks, downloadFilterType, downloadFilterValue]);

  const updateSubtaskState = (
    currentSubs: Subtask[],
    path: number[],
    updater: (sub: Subtask, index: number) => Subtask | null,
    action: "update" | "remove" | "add" = "update"
  ): Subtask[] => {
    const newSubs = JSON.parse(JSON.stringify(currentSubs));
    let currentLevel = newSubs;
    
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (i === path.length - 1) {
        if (action === "remove") {
          currentLevel.splice(index, 1);
        } else if (action === "add") {
          const parent = currentLevel[index];
          if (!parent.subtasks) parent.subtasks = [];
          const nextIdx = parent.subtasks.length + 1;
          parent.subtasks.push({
            id: `${parent.id}.${nextIdx}`,
            title: "", assigneeName: "", status: "Pending", completion: 0, remarks: "", subtasks: [],
            isEditing: true, isExpanded: true, date: new Date().toISOString().split("T")[0],
          });
        } else {
          const updated = updater(currentLevel[index], index);
          if (updated) currentLevel[index] = updated;
        }
      } else {
        if (!currentLevel[index].subtasks) currentLevel[index].subtasks = [];
        currentLevel = currentLevel[index].subtasks;
      }
    }
    return newSubs;
  };

  const openTaskModal = (task: Task) => {
    const aggregatedTask = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregatedTask);
    setIsModalOpen(true);
    setIsEditing(false);
    setSubtasks(aggregatedTask.subtasks || []);
    setCurrentProjectPrefix(aggregatedTask.projectId);
  };

  const onTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
      toast.success(`Status updated.`);
    } catch { toast.error("Error."); }
  }, []);

  const onSubtaskStatusChange = useCallback(async (taskId: string, subtaskId: string, newStatus: string) => {
    const target = tasks.find(t => t._id === taskId);
    if (!target) return;
    const findAndMap = (subs: Subtask[]): Subtask[] => subs.map(s => 
      s.id === subtaskId ? { ...s, status: newStatus } : { ...s, subtasks: findAndMap(s.subtasks || []) }
    );
    try {
      await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: findAndMap(target.subtasks || []) }),
      });
      fetchTasks();
      toast.success("Updated.");
    } catch { toast.error("Error."); }
  }, [tasks]);

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Delete?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted.");
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch { toast.error("Error."); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${selectedTaskForModal._id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftTask, subtasks }),
      });
      if (res.ok) {
        toast.success("Saved.");
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch { toast.error("Error."); }
  };

  if (loading || !minLoadTimePassed) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-center">
        <img src="/load.gif" alt="Loading..." className="w-80 h-auto mx-auto mb-4" />
        <p className="text-slate-900 font-bold uppercase tracking-widest">Syncing Accounts Data...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      <ToastContainer position="bottom-right" />

      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        {/* NAVIGATION BAR */}
        <nav className="fixed top-30 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 z-20 border border-gray-200">
          <button 
            onClick={() => setViewType("card")} 
            className={`p-3 rounded-xl transition-all ${viewType === "card" ? "text-white shadow-lg" : "text-slate-900 hover:bg-slate-100"}`}
            style={viewType === "card" ? { backgroundColor: "#3fa87d" } : {}}
          >
            <LayoutGrid/>
          </button>
          
          <button 
            onClick={() => setViewType("board")} 
            className={`p-3 rounded-xl transition-all ${viewType === "board" ? "text-white shadow-lg" : "text-slate-900 hover:bg-slate-100"}`}
            style={viewType === "board" ? { backgroundColor: "#3fa87d" } : {}}
          >
            <ListTodo/>
          </button>
          
          <button 
            onClick={() => setViewType("chart")} 
            className={`p-3 rounded-xl transition-all ${viewType === "chart" ? "text-white shadow-lg" : "text-slate-900 hover:bg-slate-100"}`}
            style={viewType === "chart" ? { backgroundColor: "#3fa87d" } : {}}
          >
            <BarChart2/>
          </button>
        </nav>

        <div className="max-w-[1800px] mx-auto">
          <TaskTableHeader
            uniqueProjects={Array.from(new Set(visibleTasks.map(t => t.project)))}
            employees={accountsEmployees}
            downloadFilterType={downloadFilterType}
            setDownloadFilterType={setDownloadFilterType}
            downloadFilterValue={downloadFilterValue}
            setDownloadFilterValue={setDownloadFilterValue}
            xlsxLoaded={xlsxLoaded}
            handleExcelDownload={handleExcelDownload}
          />

          <div className="flex flex-col lg:flex-row gap-8 mt-6">
            <div className="flex-1">
              {viewType === "card" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task._id} task={task} onViewDetails={openTaskModal} />
                  ))}
                </div>
              )}
              {viewType === "board" && <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />}
              {viewType === "chart" && <TaskChartView tasks={filteredTasks} />}
            </div>

            {/* VERTICAL DIVIDER */}
            <div className="hidden lg:block w-[1.5px] bg-slate-200 self-stretch my-2"></div>

            {/* RIGHT SIDEBAR */}
            <div className="w-full lg:w-80 space-y-6">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-2 sticky top-32">
                {downloadFilterType === "week" ? (
                  <>
                    <div className="p-4 border-b border-slate-100">
                      <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-900"/> Accounts Team Pulse
                      </h2>
                      <p className="text-[9px] text-slate-700 font-bold mt-1">Select member</p>
                    </div>
                    <div className="space-y-1 p-1">
                      {employeeStats.map(emp => (
                        <button key={emp._id} onClick={() => setSelectedEmpStats(emp)} className="w-full text-left px-4 py-4 rounded-2xl hover:bg-slate-100 transition-all flex justify-between items-center group">
                          <div className="flex-1">
                            <span className="font-black text-slate-800 block text-sm">{emp.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[11px] font-black text-white bg-[#3fa87d] px-1.5 py-0.5 rounded-md">{emp.percentage}%</span>
                               {emp.variance !== 0 ? (
                                 <span className={`text-[10px] font-black flex items-center ${emp.variance > 0 ? 'text-[#3fa87d]' : 'text-red-600'}`}>
                                   <span className="p-0.5 bg-slate-900 rounded-sm mr-1">
                                      {emp.variance > 0 ? <TrendingUp className="w-3 h-3 text-white"/> : <TrendingDown className="w-3 h-3 text-white"/>}
                                   </span>
                                   {Math.abs(emp.variance)}%
                                 </span>
                               ) : (
                                 <span className="text-[10px] text-slate-800 font-black uppercase tracking-tight">Stable</span>
                               )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 border-b border-slate-100">
                      <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-900"/> Accounts Task Log
                      </h2>
                      <p className="text-[9px] text-slate-700 font-bold mt-1">Snapshot of {filteredTasks.length} projects</p>
                    </div>
                    <div className="space-y-2 p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                      {filteredTasks.map((task: any) => {
                          const aggregated = getAggregatedTaskData(task);
                          return (
                              <button key={task._id} onClick={() => openTaskModal(task)} className="w-full text-left p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#3fa87d] hover:bg-white transition-all group shadow-sm mb-2">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white uppercase tracking-tighter">{task.projectId || "PRJ"}</span>
                                      <div className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${task.status === 'Completed' ? 'border-[#3fa87d] text-[#3fa87d]' : 'border-amber-400 text-amber-600'}`}>
                                          {task.status.toUpperCase()}
                                      </div>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 line-clamp-1 mb-3 group-hover:text-[#3fa87d] transition-colors">{task.title || task.project}</h4>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="flex items-center gap-1.5">
                                          <div className="p-1 bg-white rounded-lg border border-slate-200"><User className="w-2.5 h-2.5 text-slate-600"/></div>
                                          <div className="flex flex-col min-w-0">
                                              <span className="text-[7px] text-slate-500 font-black uppercase">Assignee</span>
                                              <span className="text-[9px] font-bold text-slate-800 truncate">{task.assigneeNames?.[0] || "None"}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                          <div className="p-1 bg-white rounded-lg border border-slate-200"><Timer className="w-2.5 h-2.5 text-slate-600"/></div>
                                          <div className="flex flex-col">
                                              <span className="text-[7px] text-slate-500 font-black uppercase">Duration</span>
                                              <span className="text-[9px] font-bold text-slate-800">{getDuration(task.startDate, task.dueDate)}</span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                          <div className="h-full bg-[#3fa87d] transition-all duration-700" style={{ width: `${aggregated.completion}%` }} />
                                      </div>
                                      <span className="text-[9px] font-black text-slate-900">{aggregated.completion}%</span>
                                  </div>
                              </button>
                          );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmployeeStatsModal 
        emp={selectedEmpStats} 
        isOpen={!!selectedEmpStats} 
        onClose={() => setSelectedEmpStats(null)} 
        week={downloadFilterValue} 
      />

      {selectedTaskForModal && (
        <TaskModal
          task={selectedTaskForModal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isEditing={isEditing}
          draftTask={draftTask}
          subtasks={subtasks}
          employees={accountsEmployees}
          currentProjectPrefix={currentProjectPrefix}
          allTaskStatuses={allTaskStatuses}
          handleEdit={() => { setIsEditing(true); setDraftTask(selectedTaskForModal); }}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
          cancelEdit={() => setIsEditing(false)}
          handleDraftChange={(e) => setDraftTask({...draftTask, [e.target.name]: e.target.value})}
          handleSubtaskChange={(path, field, val) => setSubtasks(updateSubtaskState(subtasks, path, (s) => ({...s, [field]: val})))}
          addSubtask={(path) => setSubtasks(updateSubtaskState(subtasks, path, () => null, "add"))}
          removeSubtask={(path) => setSubtasks(updateSubtaskState(subtasks, path, () => null, "remove"))}
          onToggleEdit={(path) => setSubtasks(updateSubtaskState(subtasks, path, (s) => ({...s, isEditing: !s.isEditing})))}
          onToggleExpansion={(path) => setSubtasks(updateSubtaskState(subtasks, path, (s) => ({...s, isExpanded: !s.isExpanded})))}
          handleStartSprint={() => onTaskStatusChange(selectedTaskForModal._id, "In Progress")}
          onTaskStatusChange={onTaskStatusChange}
          onSubtaskStatusChange={onSubtaskStatusChange}
        />
      )}
    </div>
  );
};

export default TasksPage;