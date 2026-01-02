"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
} from "react";
import { 
  AlertCircle, 
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
  Percent,
  CheckCircle2,
  Clock,
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
  SubtaskChangeHandler, 
  SubtaskPathHandler,
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

// --- Helper Functions ---
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

// --- Sub-Component: Employee Detailed Stats Modal ---
const EmployeeStatsModal: React.FC<{
  emp: any;
  isOpen: boolean;
  onClose: () => void;
  week: string;
}> = ({ emp, isOpen, onClose, week }) => {
  if (!isOpen || !emp) return null;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const trend = emp.percentage - emp.prevPercentage;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-6 border-b border-indigo-100 flex justify-between items-center bg-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2"><User className="w-5 h-5" />{emp.name}</h2>
            <p className="text-xs opacity-90 font-medium">Weekly Resource Analysis • {week}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Avg Weekly Completion</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-black text-indigo-600">{emp.percentage}%</p>
                {trend !== 0 && (
                  <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1"/> : <TrendingDown className="w-3 h-3 mr-1"/>}
                    {Math.abs(trend)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Subtasks Handled</p>
              <p className="text-3xl font-black text-slate-700">{emp.taskCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" /> Daily Work Pulse
            </h3>
            <div className="flex justify-between gap-2">
              {days.map((day, idx) => {
                const dayData = emp.dailyCompletion[idx + 1] || 0;
                const isPresent = dayData > 0;
                return (
                  <div key={day} className="flex-1 text-center">
                    <div className={`aspect-square rounded-xl flex items-center justify-center mb-2 border-2 transition-all ${isPresent ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-400'}`}>
                      <span className="text-xs font-black">{isPresent ? `${dayData}%` : 'ABS'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 px-1"><List className="w-4 h-4 text-indigo-500" />Detailed Work Log</h3>
            <div className="space-y-3">
               {emp.items && emp.items.length > 0 ? emp.items.map((item: any, idx: number) => (
                 <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                           <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-tight">
                              <Target className="w-3 h-3"/> {item.parentTask}
                           </div>
                           <div className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                              {item.parentStatus}
                           </div>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                              Completion: {item.parentCompletion}%
                           </div>
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-tight">{item.title}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-xs font-black text-white bg-indigo-600 px-2 py-1 rounded-lg shadow-sm">
                          {item.completion}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold uppercase">
                       <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/> {item.date}</span>
                       <span className={`italic font-black flex items-center gap-1 ${item.status === 'Completed' ? 'text-green-500' : 'text-amber-500'}`}>
                         {item.status === 'Completed' ? <CheckCircle2 className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                         Subtask: {item.status || "Pending"}
                       </span>
                    </div>
                 </div>
               )) : (
                 <p className="text-center text-sm text-slate-400 py-6">No tasks logged.</p>
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

  const techEmployees = useMemo(() => 
    employees.filter((e) => {
        const team = (e as any).team?.toLowerCase?.();
        return team === "tech" || team === "it admin";
    }), [employees]
  );

  const visibleTasks = useMemo(() => 
    tasks.filter((task) => {
      const dept = (task.department || "").toLowerCase();
      return dept.includes("tech") || dept.includes("it admin");
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

  // --- Logic for Alignment and Specific Weekly Subtask Export ---
  const handleExcelDownload = useCallback(() => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Excel library is still loading...");
      return;
    }

    let finalData: any[] = [];
    let wscols: any[] = [];

    if (downloadFilterType === "week" && downloadFilterValue) {
      // Logic: Export specific subtasks for the selected week
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

      // Specific Alignment Widths for Weekly Export
      wscols = [
        { wch: 12 }, { wch: 20 }, { wch: 35 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }
      ];
    } else {
      // Logic: Default Parent Task Export
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

      // Specific Alignment Widths for Standard Export
      wscols = [
        { wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }
      ];
    }

    if (finalData.length === 0) {
      toast.info("No records match your filters.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(finalData);
    worksheet["!cols"] = wscols; // Applying the alignment/width fix

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resource Report");
    XLSX.writeFile(workbook, `Report_${downloadFilterValue || 'Data'}.xlsx`);
    
    toast.success("Excel report exported with proper formatting!");
  }, [tasks, filteredTasks, downloadFilterType, downloadFilterValue]);

  const employeeStats = useMemo(() => {
    if (downloadFilterType !== "week" || !downloadFilterValue) return [];
    const prevWeek = getPreviousWeek(downloadFilterValue);

    return techEmployees.map(emp => {
      let currentItems: any[] = [];
      let currentTotalSum = 0;
      let prevTotalSum = 0;
      let prevCount = 0;
      let dailyCompletion: Record<number, number> = {};

      tasks.forEach((task: any) => {
        const aggregatedParent = getAggregatedTaskData(task);
        const parentTitle = task.title || task.project || "Main Task";
        const parentCompletion = aggregatedParent.completion || 0;
        const parentStatus = task.status;

        const processSubs = (subs: Subtask[]) => {
          subs.forEach(s => {
            if (s.assigneeName === emp.name) {
              if (isDateInWeek(s.date, downloadFilterValue)) {
                currentItems.push({ 
                  title: s.title, 
                  parentTask: parentTitle,
                  parentCompletion: parentCompletion,
                  parentStatus: parentStatus,
                  completion: s.completion || 0, 
                  status: s.status,
                  date: s.date 
                });
                currentTotalSum += (s.completion || 0);
                const day = new Date(s.date as string).getUTCDay();
                if (day >= 1 && day <= 5) dailyCompletion[day] = Math.max(dailyCompletion[day] || 0, s.completion || 0);
              }
              if (isDateInWeek(s.date, prevWeek)) {
                prevTotalSum += (s.completion || 0);
                prevCount++;
              }
            }
            if (s.subtasks) processSubs(s.subtasks);
          });
        };
        if (task.subtasks) processSubs(task.subtasks);
      });

      return {
        ...emp,
        taskCount: currentItems.length,
        items: currentItems,
        dailyCompletion,
        percentage: currentItems.length > 0 ? Math.round(currentTotalSum / currentItems.length) : 0,
        prevPercentage: prevCount > 0 ? Math.round(prevTotalSum / prevCount) : 0
      };
    });
  }, [tasks, techEmployees, downloadFilterType, downloadFilterValue]);

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
      toast.success(`Task status: ${newStatus}`);
    } catch { toast.error("Error updating status."); }
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
      toast.success("Subtask status updated.");
    } catch { toast.error("Error updating subtask."); }
  }, [tasks]);

  const handleDelete = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Task deleted successfully");
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch { toast.error("Failed to delete task"); }
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
        toast.success("Task updated!");
        setIsModalOpen(false);
        fetchTasks();
      }
    } catch { toast.error("Update failed."); }
  };

  if (loading || !minLoadTimePassed) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-center">
        <img src="/load.gif" alt="Loading..." className="w-80 h-auto mx-auto mb-4" />
        <p className="text-slate-700 font-medium">Synchronizing Resource Data...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      <ToastContainer position="bottom-right" />

      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        <nav className="fixed top-30 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 z-20 border border-gray-200">
          <button onClick={() => setViewType("card")} className={`p-3 rounded-xl transition-all ${viewType === "card" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><LayoutGrid/></button>
          <button onClick={() => setViewType("board")} className={`p-3 rounded-xl transition-all ${viewType === "board" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><ListTodo/></button>
          <button onClick={() => setViewType("chart")} className={`p-3 rounded-xl transition-all ${viewType === "chart" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-50"}`}><BarChart2/></button>
        </nav>

        <div className="max-w-[1800px] mx-auto bg-white">
          <TaskTableHeader
            uniqueProjects={Array.from(new Set(visibleTasks.map(t => t.project)))}
            employees={techEmployees}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task._id} task={task} onViewDetails={openTaskModal} />
                  ))}
                </div>
              )}
              {viewType === "board" && <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />}
              {viewType === "chart" && <TaskChartView tasks={filteredTasks} />}
            </div>

            {downloadFilterType === "week" && (
              <div className="w-full lg:w-72">
                <div className="sticky top-32 bg-white rounded-3xl shadow-xl border border-slate-100 p-2">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase p-4 tracking-widest flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500"/> Team Capacity
                  </h2>
                  <div className="space-y-1">
                    {employeeStats.map(emp => (
                      <button key={emp._id} onClick={() => setSelectedEmpStats(emp)} className="w-full text-left px-5 py-4 rounded-2xl hover:bg-indigo-50 transition-all flex justify-between items-center group">
                        <div>
                          <span className="font-bold text-slate-700 block text-sm">{emp.name}</span>
                          <span className="text-[10px] font-bold text-indigo-400">{emp.percentage}% weekly avg</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
          employees={techEmployees}
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