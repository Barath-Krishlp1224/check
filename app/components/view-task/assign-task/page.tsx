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
  Play
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Task, Subtask, Employee, SubtaskChangeHandler, SubtaskPathHandler } from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board";
type Role = "Admin" | "Manager" | "TeamLead" | "Employee";
type ScreenType = "tasks" | "leave" | "attendance" | "chat" | "payslip";

const allTaskStatuses = [
  "Backlog", "In Progress", "Dev Review", "Deployed in QA", 
  "Test In Progress", "QA Sign Off", "Deployment Stage", 
  "Pilot Test", "Completed", "Paused",
];

// --- Sub-Component: Coming Soon ---
const ComingSoon: React.FC<{ title?: string }> = ({ title = "Feature" }) => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-green-50 via-white to-green-50">
    <div className="text-center">
      <div className="relative inline-block">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-green-200 rounded-full animate-ping opacity-20"></div>
        </div>
        <div className="relative z-10 bg-white rounded-full p-8 shadow-xl">
          <MessageSquare className="w-16 h-16 text-green-600 animate-bounce" />
        </div>
      </div>
      <h1 className="mt-8 text-5xl font-bold text-gray-800">Coming Soon</h1>
      <p className="mt-4 text-xl text-gray-600">{title} feature is under development</p>
    </div>
  </div>
);

const TasksPage: React.FC = () => {
  const router = useRouter();
  
  // States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewType, setViewType] = useState<ViewType>("card");
  
  // UPDATED: Default screen set to "tasks" (Task List)
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("tasks");
  
  // Modal & Edit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  
  // UI States
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // --- API Utils ---
  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path}`;
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(getApiUrl("/api/tasks"));
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
      else setError(data.error || "Failed to fetch tasks.");
    } catch { setError("Server connection error."); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(getApiUrl("/api/employees"));
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch {}
  };

  const triggerReminders = async () => {
    try {
      await fetch(getApiUrl("/api/tasks/reminders"), { method: "POST" });
    } catch (err) { console.warn("Reminders failed", err); }
  };

  // --- Subtask Logic ---
  const getNewSubtask = (prefix: string, path: number[]): Subtask => ({
    id: prefix + (path.length > 0 ? `.${path.join('.')}` : '-S1'),
    title: "",
    assigneeName: "",
    status: "Pending",
    completion: 0,
    remarks: "",
    subtasks: [],
    isEditing: true,
    isExpanded: true,
    date: new Date().toISOString().split('T')[0],
    timeSpent: "",
    storyPoints: 0,
  });

  const updateSubtaskState = (currentSubs: Subtask[], path: number[], updater: (sub: Subtask, index: number) => Subtask | null, action: 'update' | 'remove' | 'add' = 'update'): Subtask[] => {
    let newSubs = JSON.parse(JSON.stringify(currentSubs));
    let currentLevel = newSubs;
    
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (i === path.length - 1) {
        if (action === 'remove') currentLevel.splice(index, 1);
        else if (action === 'add') {
          const parent = currentLevel[index];
          if (!parent.subtasks) parent.subtasks = [];
          const newNestedId = `${parent.id}.${parent.subtasks.length + 1}`;
          parent.subtasks.push({ ...getNewSubtask(currentProjectPrefix, [...path, parent.subtasks.length]), id: newNestedId });
        } else {
          const updated = updater(currentLevel[index], index);
          if (updated) currentLevel[index] = updated;
        }
      } else {
        currentLevel = currentLevel[index].subtasks;
      }
    }
    return newSubs;
  };

  // --- Handlers ---
  const handleDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (name === "completion" || name === "taskStoryPoints") finalValue = Number(value);
    if (name === "assigneeNames" && type === "select-multiple") {
      finalValue = Array.from((e.target as HTMLSelectElement).selectedOptions, (opt) => opt.value);
    }
    setDraftTask(prev => ({ ...prev, [name]: finalValue }));
  };

  const openTaskModal = (task: Task) => {
    const aggregated = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregated);
    setSubtasks(aggregated.subtasks || []);
    setCurrentProjectPrefix(aggregated.projectId);
    setDraftTask(aggregated); // Initialize draft
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
        fetchTasks(); 
        toast.success(`Status updated to ${newStatus}`); 
      }
    } catch { toast.error("Update failed."); }
  }, []);

  const handleStartSprint = async (taskId: string) => {
    if (!window.confirm("Start this sprint?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "In Progress" }),
      });
      if (res.ok) {
        fetchTasks();
        closeTaskModal();
        toast.success("Sprint Started!");
      }
    } catch { toast.error("Failed to start sprint."); }
  };

  const onSubtaskStatusChange = useCallback(async (taskId: string, subtaskId: string, newStatus: string) => {
    const findAndMap = (subs: Subtask[]): Subtask[] => 
      subs.map(s => s.id === subtaskId ? { ...s, status: newStatus } : { ...s, subtasks: findAndMap(s.subtasks || []) });

    const target = tasks.find(t => t._id === taskId);
    if (!target) return;

    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: findAndMap(target.subtasks || []) }),
      });
      if (res.ok) fetchTasks();
    } catch {}
  }, [tasks]);

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
        toast.success("Task updated successfully!");
        fetchTasks();
        closeTaskModal();
      }
    } catch { toast.error("Update failed."); }
  };

  // --- Effects ---
  useEffect(() => {
    import("xlsx").then(XLSX => { (window as any).XLSX = XLSX; setXlsxLoaded(true); });
    if (typeof window !== "undefined") {
      setCurrentUserRole((localStorage.getItem("userRole") || "") as Role);
      setCurrentUserName(localStorage.getItem("userName") || "");
    }
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchEmployees(), triggerReminders()]);
      setTimeout(() => setLoading(false), 1500);
    };
    init();
  }, []);

  // --- Memos ---
  const visibleTasks = useMemo(() => {
    if (currentUserRole === "Employee" && currentUserName.trim()) {
      const nameLower = currentUserName.toLowerCase();
      return tasks.filter(t => t.assigneeNames?.some(a => a.toLowerCase() === nameLower));
    }
    return tasks;
  }, [tasks, currentUserRole, currentUserName]);

  const uniqueProjects = useMemo(() => Array.from(new Set(visibleTasks.map(t => t.project).filter(Boolean))), [visibleTasks]);

  const filteredTasks = useMemo(() => {
    const val = downloadFilterValue.trim().toLowerCase();
    if (downloadFilterType === "all" || !val) return visibleTasks;
    return visibleTasks.filter(t => {
      if (downloadFilterType === "project") return t.project.toLowerCase() === val;
      if (downloadFilterType === "status") return t.status.toLowerCase() === val;
      if (downloadFilterType === "assignee") return val === "all" ? true : t.assigneeNames?.some(a => a.toLowerCase() === val);
      return true;
    });
  }, [visibleTasks, downloadFilterType, downloadFilterValue]);

  if (loading) return <div className="flex justify-center items-center min-h-screen bg-white"><img src="/load.gif" alt="Loading..." className="h-70 w-100 mx-auto" /></div>;

  return (
    <div className="flex min-h-screen bg-white">
      <ToastContainer /> 
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        
        {/* CENTERED NAVBAR */}
        <nav className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-full px-10 py-4 flex items-center space-x-10 z-50 border border-gray-100 whitespace-nowrap">
          <button onClick={() => setCurrentScreen("attendance")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "attendance" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <UserCheck className={`w-7 h-7 mb-1 ${currentScreen === "attendance" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
          </button>

          <button onClick={() => { setCurrentScreen("tasks"); setViewType("board"); }} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "board" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Kanban className={`w-7 h-7 mb-1 ${currentScreen === "tasks" && viewType === "board" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Board</span>
          </button>

          <button onClick={() => setCurrentScreen("chat")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "chat" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <MessageSquare className={`w-7 h-7 mb-1 ${currentScreen === "chat" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </button>

          <button onClick={() => setIsHolidaysOpen(true)} className="flex flex-col items-center text-gray-400 hover:text-green-500 transition-all duration-200">
            <Calendar className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Holidays</span>
          </button>

          <button onClick={() => setCurrentScreen("leave")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "leave" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Palmtree className={`w-7 h-7 mb-1 ${currentScreen === "leave" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">History & Leaves</span>
          </button>

          <button onClick={() => setCurrentScreen("payslip")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "payslip" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Banknote className={`w-7 h-7 mb-1 ${currentScreen === "payslip" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Payslip</span>
          </button>

          <button onClick={() => { setCurrentScreen("tasks"); setViewType("card"); }} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "card" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <ClipboardList className={`w-7 h-7 mb-1 ${currentScreen === "tasks" && viewType === "card" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Task List</span>
          </button>
        </nav>

        <div className="max-w-[1800px] mx-auto bg-white mt-12">
          {currentScreen === "tasks" ? (
            <>
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
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
                  <h3 className="mt-2 text-slate-700">No tasks found</h3>
                </div>
              ) : (
                <>
                  {viewType === "card" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">{filteredTasks.map((t) => <TaskCard key={t._id} task={t} onViewDetails={openTaskModal} />)}</div>}
                  {viewType === "board" && <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />}
                </>
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
                  handleDelete={async (id) => { if(confirm("Delete Task?")) { await fetch(getApiUrl(`/api/tasks/${id}`), {method: "DELETE"}); fetchTasks(); closeTaskModal(); } }} 
                  handleUpdate={handleUpdate} 
                  cancelEdit={() => setIsEditing(false)} 
                  handleDraftChange={handleDraftChange} 
                  handleSubtaskChange={(path, field, val) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, [field]: val })))} 
                  addSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'add'))} 
                  removeSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'remove'))} 
                  onToggleEdit={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isEditing: !s.isEditing })))} 
                  onToggleExpansion={(path) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, isExpanded: !s.isExpanded })))} 
                  handleStartSprint={handleStartSprint}
                  onTaskStatusChange={onTaskStatusChange} 
                  onSubtaskStatusChange={onSubtaskStatusChange} 
                />
              )}
            </>
          ) : currentScreen === "leave" ? <EmpLeave /> 
          : currentScreen === "attendance" ? <AttendancePage /> 
          : currentScreen === "payslip" ? <PayslipPage /> 
          : currentScreen === "chat" ? <ComingSoon title="Chat" /> 
          : null}
        </div>
      </div>

      <HolidaysModal open={isHolidaysOpen} onClose={() => setIsHolidaysOpen(false)} />
      
      <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="fixed bottom-6 right-6 p-4 bg-green-600 text-white rounded-full shadow-2xl z-50 hover:scale-110 transition-transform">
        {isNotesOpen ? <X className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
      </button>

      {isNotesOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-green-600 p-4 text-white font-semibold flex justify-between"><span>My Notes</span><button onClick={() => setIsNotesOpen(false)}><X className="w-4 h-4" /></button></div>
          <div className="flex-1 overflow-auto"><NotesPage /></div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;