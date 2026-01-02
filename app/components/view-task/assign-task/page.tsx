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

  // --- RECURSIVE SUBTASK LOGIC ---
  const getNewSubtask = (prefix: string, path: number[]): Subtask => ({
    id: prefix + (path.length > 0 ? `-S${path.join('.')}` : '-S1'),
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

  const updateSubtaskState = (
    currentSubs: Subtask[], 
    path: number[], 
    updater: (sub: Subtask, index: number) => Subtask | null, 
    action: 'update' | 'remove' | 'add' = 'update'
  ): Subtask[] => {
    const newSubs = JSON.parse(JSON.stringify(currentSubs));

    if (action === 'add' && path.length === 0) {
      const freshSub = getNewSubtask(currentProjectPrefix, []);
      freshSub.id = `${currentProjectPrefix}-S${newSubs.length + 1}`;
      newSubs.push(freshSub);
      toast.info("New top-level subtask added");
      return newSubs;
    }

    const reachTarget = (list: Subtask[], targetPath: number[]): Subtask[] => {
      const [currentIndex, ...remainingPath] = targetPath;

      if (remainingPath.length === 0) {
        if (action === 'remove') {
          list.splice(currentIndex, 1);
          toast.warn("Subtask deleted from draft");
        } else if (action === 'add') {
          const parent = list[currentIndex];
          if (!parent.subtasks) parent.subtasks = [];
          const freshNested = getNewSubtask(currentProjectPrefix, []);
          freshNested.id = `${parent.id}.${parent.subtasks.length + 1}`;
          parent.subtasks.push(freshNested);
          toast.info("Nested subtask added");
        } else {
          const updated = updater(list[currentIndex], currentIndex);
          if (updated) list[currentIndex] = updated;
        }
        return list;
      }

      if (list[currentIndex] && list[currentIndex].subtasks) {
        list[currentIndex].subtasks = reachTarget(list[currentIndex].subtasks!, remainingPath);
      }
      return list;
    };

    return reachTarget(newSubs, path);
  };

  // --- Handlers ---
  const handleDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (name === "completion" || name === "taskStoryPoints") finalValue = Number(value);
    setDraftTask(prev => ({ ...prev, [name]: finalValue }));
  };

  const openTaskModal = (task: Task) => {
    const aggregated = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregated);
    setSubtasks(aggregated.subtasks || []);
    setCurrentProjectPrefix(aggregated.projectId);
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
        fetchTasks(); 
        toast.success(`Task status updated to ${newStatus}`); 
      }
    } catch { toast.error("Failed to update task status"); }
  }, []);

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
      if (res.ok) {
        fetchTasks();
        toast.success(`Subtask status updated to ${newStatus}`);
      }
    } catch { toast.error("Failed to update subtask status"); }
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
        toast.success("All changes saved successfully!");
        fetchTasks();
        closeTaskModal();
      } else {
        toast.error("Failed to save changes.");
      }
    } catch { toast.error("Server connection error."); }
  };

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

  // --- Effects ---
  useEffect(() => {
    import("xlsx").then(XLSX => { (window as any).XLSX = XLSX; setXlsxLoaded(true); });
    if (typeof window !== "undefined") {
      setCurrentUserRole((localStorage.getItem("userRole") || "") as Role);
      setCurrentUserName(localStorage.getItem("userName") || "");
    }
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setTimeout(() => setLoading(false), 1000);
    };
    init();
  }, []);

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
      <ToastContainer position="top-right" autoClose={3000} /> 
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        
        {/* NAV BAR */}
        <nav className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-full px-10 py-4 flex items-center space-x-10 z-50 border border-gray-100 whitespace-nowrap">
          <button onClick={() => setCurrentScreen("attendance")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "attendance" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <UserCheck className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
          </button>
          <button onClick={() => { setCurrentScreen("tasks"); setViewType("board"); }} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "board" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Kanban className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Board</span>
          </button>
          <button onClick={() => setCurrentScreen("chat")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "chat" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <MessageSquare className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </button>
          <button onClick={() => setIsHolidaysOpen(true)} className="flex flex-col items-center text-gray-400 hover:text-green-500 transition-all duration-200">
            <Calendar className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Holidays</span>
          </button>
          <button onClick={() => setCurrentScreen("leave")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "leave" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Palmtree className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">History & Leaves</span>
          </button>
          <button onClick={() => setCurrentScreen("payslip")} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "payslip" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <Banknote className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Payslip</span>
          </button>
          <button onClick={() => { setCurrentScreen("tasks"); setViewType("card"); }} className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "card" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}>
            <ClipboardList className="w-7 h-7 mb-1" />
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
                handleExcelDownload={() => toast.info("Preparing Excel download...")} 
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
                  handleEdit={() => {
                    setIsEditing(true);
                    toast.info("Switched to Edit Mode");
                  }} 
                  handleDelete={async (id) => { 
                    if(confirm("Delete Task?")) { 
                      await fetch(getApiUrl(`/api/tasks/${id}`), {method: "DELETE"}); 
                      toast.success("Task deleted successfully");
                      fetchTasks(); 
                      closeTaskModal(); 
                    } 
                  }} 
                  handleUpdate={handleUpdate} 
                  cancelEdit={() => {
                    setIsEditing(false);
                    toast.warn("Edit cancelled");
                  }} 
                  handleDraftChange={handleDraftChange} 
                  handleSubtaskChange={(path, field, val) => setSubtasks(prev => updateSubtaskState(prev, path, (s) => ({ ...s, [field]: val })))} 
                  addSubtask={(path) => setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'add'))} 
                  removeSubtask={(path) => {
                    if(window.confirm("Are you sure you want to delete this subtask?")) {
                       setSubtasks(prev => updateSubtaskState(prev, path, () => null, 'remove'));
                    }
                  }} 
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