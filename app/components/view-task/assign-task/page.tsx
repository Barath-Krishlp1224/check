"use client";

import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  FileText, 
  X,
  UserCheck,
  ClipboardList,
  Kanban,
  Palmtree,
  Banknote,
  Search,
  RefreshCcw,
  Trello
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Component Imports
import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import HolidaysModal from "./components/HolidaysModal";
import NotesPage from "../../notes/page";
import EmpLeave from "../../emp-leave/page";
import AttendancePage from "../../attendance/emp/page";
import PayslipPage from "../../payslip/page";

// Types & Utils
import { Task, Subtask, Employee } from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board";
type Role = "Admin" | "Manager" | "TeamLead" | "Employee";
type ScreenType = "tasks" | "leave" | "attendance" | "chat" | "payslip";

const allTaskStatuses = [
  "Backlog", "In Progress", "Dev Review", "Deployed in QA", 
  "Test In Progress", "QA Sign Off", "Deployment Stage", 
  "Pilot Test", "Completed", "Paused",
];

const ComingSoon: React.FC<{ title?: string }> = ({ title = "Feature" }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 m-8">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-25"></div>
      <div className="relative bg-white rounded-full p-8 shadow-2xl">
        <MessageSquare className="w-16 h-16 text-green-600 animate-bounce" />
      </div>
    </div>
    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Coming Soon</h1>
    <p className="mt-2 text-slate-500 font-medium">{title} is under development.</p>
  </div>
);

const TasksPage: React.FC = () => {
  // --- States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>("board");
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("tasks");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path}`;
  };

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/tasks"));
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
    } catch { toast.error("Connection error"); }
    finally { setLoading(false); }
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(getApiUrl("/api/employees"));
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch {}
  };

  const getNewSubtask = (prefix: string, pathStr: string): Subtask => ({
    id: `${prefix}-S${pathStr}`,
    title: "",
    assigneeName: "",
    status: "Pending",
    completion: 0,
    remarks: "",
    subtasks: [],
    isEditing: true,
    isExpanded: true,
    date: new Date().toISOString().split('T')[0],
    timeSpent: "0", 
    storyPoints: 0,
  });

  const updateSubtaskState = (
    currentSubs: Subtask[], 
    path: number[], 
    updater: (sub: Subtask) => Subtask | null, 
    action: 'update' | 'remove' | 'add' = 'update'
  ): Subtask[] => {
    const newSubs = JSON.parse(JSON.stringify(currentSubs));
    
    if (action === 'add' && path.length === 0) {
      newSubs.push(getNewSubtask(currentProjectPrefix, (newSubs.length + 1).toString()));
      return newSubs;
    }

    const traverse = (list: Subtask[], targetPath: number[]): Subtask[] => {
      const [idx, ...rest] = targetPath;
      if (rest.length === 0) {
        if (action === 'remove') list.splice(idx, 1);
        else if (action === 'add') {
          if (!list[idx].subtasks) list[idx].subtasks = [];
          const newPath = `${list[idx].id}.${list[idx].subtasks!.length + 1}`;
          list[idx].subtasks!.push(getNewSubtask(currentProjectPrefix, newPath));
        } else {
          const updated = updater(list[idx]);
          if (updated) list[idx] = updated;
        }
        return list;
      }
      if (list[idx].subtasks) list[idx].subtasks = traverse(list[idx].subtasks!, rest);
      return list;
    };
    return traverse(newSubs, path);
  };

  const handleDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDraftTask(prev => ({ 
      ...prev, 
      [name]: (name === "completion" || name === "taskStoryPoints") ? Number(value) : value 
    }));
  };

  const openTaskModal = (task: Task) => {
    const aggregated = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregated);
    setSubtasks(aggregated.subtasks || []);
    setCurrentProjectPrefix(aggregated.projectId || "");
    setDraftTask(aggregated);
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedTaskForModal(null);
  };

  const onTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { 
        await fetchTasks();
        toast.success(`Task status updated`); 
      }
    } catch { toast.error("Status update failed"); }
  }, [fetchTasks]);

  const onSubtaskStatusChange = useCallback(async (taskId: string, subtaskId: string, newStatus: string) => {
    const updateRecursive = (subs: Subtask[]): Subtask[] => 
      subs.map(s => s.id === subtaskId ? { ...s, status: newStatus } : { ...s, subtasks: updateRecursive(s.subtasks || []) });
    
    const targetTask = tasks.find(t => t._id === taskId);
    if (!targetTask) return;
    try {
      await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updateRecursive(targetTask.subtasks || []) }),
      });
      await fetchTasks();
      toast.success("Subtask status updated");
    } catch { toast.error("Subtask update failed"); }
  }, [tasks, fetchTasks]);

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
        toast.success("Task updated");
        await fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Save failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Task deleted");
        await fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Delete failed"); }
  };

  useEffect(() => {
    import("xlsx").then(XLSX => { (window as any).XLSX = XLSX; setXlsxLoaded(true); });
    if (typeof window !== "undefined") {
      setCurrentUserRole((localStorage.getItem("userRole") || "") as Role);
      setCurrentUserName(localStorage.getItem("userName") || "");
    }
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchEmployees()]);
    };
    init();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    let base = tasks;
    if (currentUserRole === "Employee" && currentUserName) {
      base = base.filter(t => t.assigneeNames?.some(a => a.toLowerCase() === currentUserName.toLowerCase()));
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      base = base.filter(t => (t.remarks?.toLowerCase() || "").includes(s) || (t._id || "").includes(s) || (t.project?.toLowerCase() || "").includes(s));
    }
    const val = downloadFilterValue.trim().toLowerCase();
    if (downloadFilterType === "all" || !val) return base;
    return base.filter(t => {
      if (downloadFilterType === "project") return t.project?.toLowerCase() === val;
      if (downloadFilterType === "status") return t.status?.toLowerCase() === val;
      if (downloadFilterType === "assignee") return t.assigneeNames?.some(a => a.toLowerCase() === val);
      return true;
    });
  }, [tasks, currentUserRole, currentUserName, searchTerm, downloadFilterType, downloadFilterValue]);

  const uniqueProjects = useMemo(() => Array.from(new Set(tasks.map(t => t.project).filter(Boolean))), [tasks]);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-white"><img src="/load.gif" alt="Loading..." className="h-72 w-100" /></div>;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar /> 
      
      <div className="flex-1 min-h-screen pb-12 px-4 sm:px-6 lg:px-10 bg-[#F8FAFC] pt-32">
        
        <nav className="fixed top-25 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-2xl rounded-full px-10 py-5 flex items-center space-x-12 z-[100] border border-gray-100">
          {[
            { id: "attendance", icon: UserCheck, label: "Attendance" },
            { id: "tasks_board", icon: Kanban, label: "Board", action: () => { setCurrentScreen("tasks"); setViewType("board"); } },
            { id: "chat", icon: MessageSquare, label: "Chat" },
            { id: "leave", icon: Palmtree, label: "Leaves" },
            { id: "payslip", icon: Banknote, label: "Payslip" },
            { id: "tasks_list", icon: ClipboardList, label: "List", action: () => { setCurrentScreen("tasks"); setViewType("card"); } }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={item.action || (() => setCurrentScreen(item.id as ScreenType))} 
              className={`flex flex-col items-center transition-all ${
                (currentScreen === item.id || (item.id === "tasks_board" && currentScreen === "tasks" && viewType === "board") || (item.id === "tasks_list" && currentScreen === "tasks" && viewType === "card"))
                ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"
              }`}
            >
              <item.icon className="w-7 h-7 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
          <button onClick={() => setIsHolidaysOpen(true)} className="flex flex-col items-center text-gray-400 hover:text-orange-500">
            <Calendar className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Holidays</span>
          </button>
        </nav>

        <div className="max-w-[1800px]">
          {currentScreen === "tasks" ? (
            <div className="space-y-8">
              {/* HEADER SECTION WITH PROJECT TASKS TEXT ON LEFT */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
                <div>
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight">
                    Project Tasks
                  </h1>
                  <p className="mt-1 text-slate-500 font-medium">Overview and management of active projects</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <TaskTableHeader 
                    uniqueProjects={uniqueProjects} 
                    employees={employees} 
                    downloadFilterType={downloadFilterType} 
                    setDownloadFilterType={setDownloadFilterType} 
                    downloadFilterValue={downloadFilterValue} 
                    setDownloadFilterValue={setDownloadFilterValue} 
                    xlsxLoaded={xlsxLoaded} 
                    handleExcelDownload={() => {}} 
                  />
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                  <Trello className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                  <h3 className="text-xl font-bold text-gray-500">No tasks found</h3>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {viewType === "card" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {filteredTasks.map((t) => <TaskCard key={t._id} task={t} onViewDetails={openTaskModal} />)}
                    </div>
                  ) : (
                    <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />
                  )}
                </div>
              )}

              {selectedTaskForModal && (
                <TaskModal 
                  task={selectedTaskForModal} 
                  isOpen={isModalOpen} 
                  onClose={closeTaskModal} 
                  isEditing={isEditing} 
                  draftTask={draftTask} 
                  subtasks={subtasks} 
                  employees={employees} 
                  currentProjectPrefix={currentProjectPrefix} 
                  allTaskStatuses={allTaskStatuses}
                  handleEdit={() => setIsEditing(true)} 
                  handleDelete={handleDelete} 
                  handleUpdate={handleUpdate} 
                  cancelEdit={() => setIsEditing(false)} 
                  handleDraftChange={handleDraftChange} 
                  handleSubtaskChange={(path, field, val) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, [field]: val })))} 
                  addSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'add'))} 
                  removeSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'remove'))} 
                  onToggleEdit={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isEditing: !s.isEditing })))} 
                  onToggleExpansion={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isExpanded: !s.isExpanded })))} 
                  handleStartSprint={(id) => onTaskStatusChange(id, "In Progress")}
                  onTaskStatusChange={onTaskStatusChange} 
                  onSubtaskStatusChange={onSubtaskStatusChange} 
                />
              )}
            </div>
          ) : (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {currentScreen === "leave" ? <EmpLeave /> 
              : currentScreen === "attendance" ? <AttendancePage /> 
              : currentScreen === "payslip" ? <PayslipPage /> 
              : <ComingSoon title={currentScreen} />}
            </div>
          )}
        </div>
      </div>

      <HolidaysModal open={isHolidaysOpen} onClose={() => setIsHolidaysOpen(false)} />
      
      <button onClick={() => setIsNotesOpen(!isNotesOpen)} className={`fixed bottom-10 right-10 p-5 rounded-full shadow-2xl z-[110] transition-all ${isNotesOpen ? "bg-gray-800 text-white" : "bg-green-600 text-white hover:scale-110"}`}>
        {isNotesOpen ? <X className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
      </button>

      {isNotesOpen && (
        <div className="fixed bottom-28 right-10 w-[450px] h-[600px] bg-white border border-gray-100 rounded-[3rem] shadow-2xl z-[110] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
          <div className="bg-green-600 p-8 text-white font-bold flex justify-between items-center">
            <h3 className="text-2xl">Scratchpad</h3>
            <button onClick={() => setIsNotesOpen(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-auto"><NotesPage /></div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;