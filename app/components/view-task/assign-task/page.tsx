"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
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
  Trello,
  Layers,
  Play
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
  "Backlog", "To Do", "In Progress", "Dev Review", "Deployed in QA", 
  "Test In Progress", "QA Sign Off", "Deployment Stage", 
  "Pilot Test", "Completed", "Paused",
];

const ComingSoon: React.FC<{ title?: string }> = ({ title = "Feature" }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 m-8 text-center px-4">
    <div className="bg-white rounded-full p-8 shadow-2xl mb-6">
      <MessageSquare className="w-16 h-16 text-blue-600 animate-bounce" />
    </div>
    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Coming Soon</h1>
    <p className="mt-2 text-slate-500 font-medium capitalize">{title} module is currently under active development.</p>
  </div>
);

const TasksPage: React.FC = () => {
  // --- Data States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // --- UI Navigation ---
  const [viewType, setViewType] = useState<ViewType>("board");
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("tasks");
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- Task Editing ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");
  
  // --- Overlay States ---
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
      if (res.ok) {
        const taskData = Array.isArray(data) ? data : data.tasks;
        setTasks(taskData || []);
      }
    } catch { toast.error("Database connection lost"); }
    finally { setLoading(false); }
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(getApiUrl("/api/employees"));
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch {}
  };

  // --- Recursive Subtask Management ---
  const getNewSubtask = (prefix: string, pathStr: string): Subtask => ({
    id: `${prefix}-SUB-${pathStr}-${Math.floor(Math.random() * 1000)}`,
    title: "",
    assigneeName: "",
    status: "To Do",
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
    if (action === 'add' && path.length === 0) {
      return [...currentSubs, getNewSubtask(currentProjectPrefix, (currentSubs.length + 1).toString())];
    }

    const traverse = (list: Subtask[], targetPath: number[]): Subtask[] => {
      const [idx, ...rest] = targetPath;
      
      return list.map((item, i) => {
        if (i !== idx) return item;

        if (rest.length === 0) {
          if (action === 'add') {
            const newNestedSubs = [...(item.subtasks || [])];
            const newId = `${item.id}.${newNestedSubs.length + 1}`;
            newNestedSubs.push(getNewSubtask(currentProjectPrefix, newId));
            return { ...item, subtasks: newNestedSubs, isExpanded: true };
          }
          if (action === 'update') {
            const updated = updater(item);
            return updated ? { ...updated } : item;
          }
          return item;
        }

        return {
          ...item,
          subtasks: traverse(item.subtasks || [], rest)
        };
      }).filter((_, i) => !(action === 'remove' && targetPath.length === 1 && i === idx));
    };

    return traverse(currentSubs, path);
  };

  const openTaskModal = (task: Task) => {
    const aggregated = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregated);
    setSubtasks(aggregated.subtasks || []);
    setCurrentProjectPrefix(aggregated.taskId?.split('-')[0] || "TASK");
    setDraftTask(aggregated);
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setSelectedTaskForModal(null);
  };

  const handleStartSprint = async (taskId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "To Do", startDate: new Date().toISOString() }),
      });
      if (res.ok) {
        toast.success("Sprint Initiated");
        await fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Failed to start sprint"); }
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
        toast.info(`Status: ${newStatus}`); 
      }
    } catch { toast.error("Update failed"); }
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
    } catch {}
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
        toast.success("Task updated successfully");
        await fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Sync failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Task removed");
        await fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Delete failed"); }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserRole((localStorage.getItem("userRole") || "Employee") as Role);
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
      base = base.filter(t => 
        (t.remarks?.toLowerCase() || "").includes(s) || 
        (t.taskId?.toLowerCase() || "").includes(s) || 
        (t.project?.toLowerCase() || "").includes(s)
      );
    }
    return base;
  }, [tasks, currentUserRole, currentUserName, searchTerm]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <img src="/load.gif" alt="Loading..." className="h-64" />
      <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing Workspace</span>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" /> 
      
      <nav className="fixed top-25 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] rounded-full px-14 py-5 flex items-center space-x-16 z-[100] border border-white/50">
        {[
          { id: "attendance", icon: UserCheck, label: "Attendance" },
          { id: "tasks_board", icon: Kanban, label: "Board", action: () => { setCurrentScreen("tasks"); setViewType("board"); } },
          { id: "chat", icon: MessageSquare, label: "Chat" },
          { id: "leave", icon: Palmtree, label: "Leaves" },
          { id: "payslip", icon: Banknote, label: "Payslip" },
          { id: "tasks_list", icon: ClipboardList, label: "List", action: () => { setCurrentScreen("tasks"); setViewType("card"); } }
        ].map((item) => {
          const isActive = (currentScreen === item.id) || 
                           (item.id === "tasks_board" && currentScreen === "tasks" && viewType === "board") ||
                           (item.id === "tasks_list" && currentScreen === "tasks" && viewType === "card");
          return (
            <button 
              key={item.id}
              onClick={item.action || (() => setCurrentScreen(item.id as ScreenType))} 
              className={`flex flex-col items-center group transition-all duration-300 ${isActive ? "text-blue-600 scale-110" : "text-slate-400 hover:text-blue-500"}`}
            >
              <item.icon className="w-6 h-6 mb-1.5 transition-transform group-hover:-translate-y-1" />
              <span className="text-[9px] font-black uppercase tracking-[0.15em]">{item.label}</span>
            </button>
          );
        })}
        <div className="h-8 w-px bg-slate-200" />
        <button onClick={() => setIsHolidaysOpen(true)} className="flex flex-col items-center text-slate-400 hover:text-orange-500 transition-colors">
          <Calendar className="w-6 h-6 mb-1.5" />
          <span className="text-[9px] font-black uppercase tracking-[0.15em]">Holidays</span>
        </button>
      </nav>

      <main className="flex-1 min-h-screen pb-20 px-6 sm:px-10 lg:px-16 pt-44">
        <div className="max-w-[1750px] mx-auto">
          {currentScreen === "tasks" ? (
            <div className="space-y-12">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 px-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Layers size={22} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Flow</span>
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Workspace</h1>
                  <p className="text-slate-500 font-medium text-xl">Active Task Management ({filteredTasks.length})</p>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner text-center">
                  <Trello className="w-24 h-24 text-slate-100 mb-8" />
                  <h3 className="text-3xl font-black text-slate-300 uppercase tracking-widest">No Matches</h3>
                  <p className="text-slate-400 mt-2 font-medium max-w-sm">No tasks were found matching your current filters.</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  {viewType === "card" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
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
                  handleStartSprint={handleStartSprint}
                  cancelEdit={() => setIsEditing(false)} 
                  handleDraftChange={(e) => {
                    const { name, value } = e.target;
                    setDraftTask(prev => ({ ...prev, [name]: value }));
                  }} 
                  handleSubtaskChange={(path, field, val) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, [field]: val })))} 
                  addSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'add'))} 
                  removeSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'remove'))} 
                  onToggleEdit={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isEditing: !s.isEditing })))} 
                  onToggleExpansion={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isExpanded: !s.isExpanded })))} 
                  onTaskStatusChange={onTaskStatusChange} 
                  onSubtaskStatusChange={onSubtaskStatusChange} 
                />
              )}
            </div>
          ) : (
            <div className="animate-in zoom-in-95 duration-500">
              {currentScreen === "leave" ? <EmpLeave /> 
              : currentScreen === "attendance" ? <AttendancePage /> 
              : currentScreen === "payslip" ? <PayslipPage /> 
              : <ComingSoon title={currentScreen} />}
            </div>
          )}
        </div>
      </main>

      <HolidaysModal open={isHolidaysOpen} onClose={() => setIsHolidaysOpen(false)} />
      
      <div className="fixed bottom-12 right-12 flex flex-col items-center space-y-5 z-[110]">
        <button 
          onClick={() => setIsNotesOpen(!isNotesOpen)} 
          className={`p-7 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] transition-all duration-500 transform ${
            isNotesOpen ? "bg-slate-900 text-white rotate-90" : "bg-blue-600 text-white hover:scale-110 hover:-translate-y-2"
          }`}
        >
          {isNotesOpen ? <X className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
        </button>
      </div>

      {isNotesOpen && (
        <div className="fixed bottom-40 right-12 w-[550px] h-[750px] bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-[4rem] shadow-[0_45px_120px_rgba(0,0,0,0.3)] z-[110] flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
            <div>
              <h3 className="text-3xl font-black tracking-tight italic">Scratchpad</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Local Workspace Cache</p>
            </div>
            <button onClick={() => setIsNotesOpen(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar"><NotesPage /></div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default TasksPage;