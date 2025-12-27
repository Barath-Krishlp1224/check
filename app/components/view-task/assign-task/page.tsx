"use client";
import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { 
  AlertCircle, 
  LayoutGrid, 
  ListTodo, 
  Calendar, 
  CalendarCheck, 
  Clock, 
  MessageSquare, 
  FileText, 
  X,
  Briefcase,
  UserCheck,
  ClipboardList,
  Kanban,
  Palmtree
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import HolidaysModal from "./components/HolidaysModal";
import SubtaskModal from "./components/SubtaskModal";
import EmpLeave from "../../emp-leave/page";
import AttendancePage from "../../attendance/emp/page";
import NotesPage from "../../notes/page";
import IframeComponent from "./components/IframeComponent";
import { Task, Subtask, Employee, SubtaskChangeHandler, SubtaskPathHandler } from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board";
type Role = "Admin" | "Manager" | "TeamLead" | "Employee";
type ScreenType = "tasks" | "leave" | "attendance" | "chat";

const allTaskStatuses = [
  "Backlog",
  "In Progress",
  "Dev Review",
  "Deployed in QA",
  "Test In Progress",
  "QA Sign Off",
  "Deployment Stage",
  "Pilot Test",
  "Completed",
  "Paused",
];

// Coming Soon Component
const ComingSoon: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="text-center">
        <div className="relative inline-block">
          {/* Animated circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-green-200 rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center animation-delay-300">
            <div className="w-24 h-24 bg-green-300 rounded-full animate-ping opacity-30"></div>
          </div>
          
          {/* Icon */}
          <div className="relative z-10 bg-white rounded-full p-8 shadow-xl">
            <MessageSquare className="w-16 h-16 text-green-600 animate-bounce" />
          </div>
        </div>
        
        {/* Text */}
        <h1 className="mt-8 text-5xl font-bold text-gray-800 animate-fade-in">
          Coming Soon
        </h1>
        <p className="mt-4 text-xl text-gray-600 animate-fade-in animation-delay-300">
          Chat feature is under development
        </p>
        
        {/* Animated dots */}
        <div className="flex justify-center items-center mt-6 space-x-2">
          <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce animation-delay-400"></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

const TasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("leave");
  const [isNotesOpen, setIsNotesOpen] = useState(false);

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
    let newSubs = [...currentSubs];
    let currentLevel: Subtask[] = newSubs;
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!currentLevel) return currentSubs;
      if (i === path.length - 1) {
        if (action === 'remove') {
          currentLevel.splice(index, 1);
        } else if (action === 'add') {
          const parent = currentLevel[index];
          if (!parent.subtasks) parent.subtasks = [];
          const nextSubIndex = parent.subtasks.length;
          const newPath = [...path, nextSubIndex];
          const newNestedId = (parent.id || currentProjectPrefix) + `.${nextSubIndex + 1}`;
          parent.subtasks.push({
            ...getNewSubtask(currentProjectPrefix, newPath),
            id: newNestedId,
          });
        } else {
          const updatedSub = updater(currentLevel[index], index);
          if (updatedSub) {
            currentLevel[index] = updatedSub;
          }
        }
      } else {
        const sub: Subtask = currentLevel[index];
        if (!sub || !sub.subtasks) return currentSubs;
        currentLevel = sub.subtasks;
      }
    }
    return newSubs;
  };

  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${base}${path}`;
  };

  const fetchTasks = async () => {
    try {
      const url = getApiUrl("/api/tasks");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
      else setError(data.error || "Failed to fetch tasks.");
    } catch (err) {
      setError("Server connection error while fetching tasks.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const url = getApiUrl("/api/employees");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch (err) {}
  };

  const triggerDueDateNotifications = async () => {
    try {
      const url = getApiUrl("/api/tasks/reminders");
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn("Reminders job failed:", data.error || "Unknown error");
      }
    } catch (err) {
      console.warn("Error calling reminders API:", err);
    }
  };

  useEffect(() => {
    import("xlsx")
      .then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const role = (localStorage.getItem("userRole") || "") as Role;
      const name = localStorage.getItem("userName") || "";
      setCurrentUserRole(role || null);
      setCurrentUserName(name);
    }

    const init = async () => {
      setLoading(true); 
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      await triggerDueDateNotifications();
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    };

    init();
  }, []);

  const visibleTasks = useMemo(() => {
    if (currentUserRole === "Employee" && currentUserName.trim()) {
      const nameLower = currentUserName.toLowerCase();
      return tasks.filter((task) => task.assigneeNames?.some((assignee) => assignee.toLowerCase() === nameLower));
    }
    return tasks;
  }, [tasks, currentUserRole, currentUserName]);

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(visibleTasks.map((task) => task.project).filter(Boolean)));
  }, [visibleTasks]);

  const filteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim().toLowerCase();
    if (filter === "all" || !value) return visibleTasks;
    return visibleTasks.filter((task) => {
      switch (filter) {
        case "project": return task.project.toLowerCase() === value;
        case "assignee": return value === "all" ? true : task.assigneeNames?.some((assignee) => assignee.toLowerCase() === value);
        case "status": return task.status.toLowerCase() === value;
        case "date": return [task.startDate, task.dueDate, task.endDate].includes(downloadFilterValue);
        case "month": return task.startDate.startsWith(downloadFilterValue) || task.dueDate.startsWith(downloadFilterValue) || (task.endDate && task.endDate.startsWith(downloadFilterValue));
        default: return true;
      }
    });
  }, [visibleTasks, downloadFilterType, downloadFilterValue]);

  const openTaskModal = (task: Task) => {
    const aggregatedTask = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregatedTask);
    setIsModalOpen(true);
    setIsEditing(false);
    setDraftTask({});
    setSubtasks(aggregatedTask.subtasks || []);
    setCurrentProjectPrefix(aggregatedTask.projectId);
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedTaskForModal(null);
      cancelEdit();
    }, 300);
  };

  const handleEdit = (task: Task) => {
    setIsEditing(true);
    setDraftTask(task);
    setCurrentProjectPrefix(task.projectId);
    setSubtasks(JSON.parse(JSON.stringify(task.subtasks || [])));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraftTask({});
    setSubtasks([]);
    setCurrentProjectPrefix("");
  };

  const handleDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | string[] | number = value;
    if (name === "completion" || name === "taskStoryPoints") {
      finalValue = Number(value);
    } else if (name === "assigneeNames" && type === "select-multiple") {
      finalValue = Array.from((e.target as HTMLSelectElement).selectedOptions, (option) => option.value);
    } else if (name === "assigneeNames") {
      finalValue = [value];
    }
    setDraftTask((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubtaskChange: SubtaskChangeHandler = (path, field, value) => {
    setSubtasks((prevSubs) => updateSubtaskState(prevSubs, path, (sub) => ({ ...sub, [field]: value })));
  };

  const handleToggleEdit: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) => updateSubtaskState(prevSubs, path, (sub) => ({ ...sub, isEditing: !sub.isEditing })));
  };

  const handleToggleExpansion: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) => updateSubtaskState(prevSubs, path, (sub) => ({ ...sub, isExpanded: !sub.isExpanded })));
  };

  const addSubtask: SubtaskPathHandler = (path) => {
    if (!currentProjectPrefix) return;
    if (path.length === 0) {
      setSubtasks((prevSubs) => [...prevSubs, { ...getNewSubtask(currentProjectPrefix, [prevSubs.length]), id: `${currentProjectPrefix}-S${prevSubs.length + 1}` }]);
      return;
    }
    setSubtasks((prevSubs) => updateSubtaskState(prevSubs, path, () => null, "add"));
  };

  const removeSubtask: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) => updateSubtaskState(prevSubs, path, () => null, "remove"));
  };

  const onTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const url = getApiUrl(`/api/tasks/${taskId}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus as Task["status"] } : t)));
        fetchTasks();
        toast.success("Status updated!", { position: "bottom-right" });
      }
    } catch {
      toast.error("Update failed.");
    }
  }, []);

  const findAndMapSubtasks = (subs: Subtask[], subtaskId: string, newStatus: string): Subtask[] =>
    subs.map((sub) => sub.id === subtaskId ? { ...sub, status: newStatus } : sub.subtasks ? { ...sub, subtasks: findAndMapSubtasks(sub.subtasks, subtaskId, newStatus) } : sub);

  const onSubtaskStatusChange = useCallback(async (taskId: string, subtaskId: string, newStatus: string) => {
    try {
      const target = tasks.find((t) => t._id === taskId);
      if (!target) return;
      const updatedSubs = findAndMapSubtasks(target.subtasks || [], subtaskId, newStatus);
      const url = getApiUrl(`/api/tasks/${taskId}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: updatedSubs }),
      });
      if (res.ok) {
        fetchTasks();
        toast.success("Subtask updated!", { position: "bottom-right" });
      }
    } catch {}
  }, [tasks]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;
    const filterEmptySubs = (subs: Subtask[]): Subtask[] => subs.filter((s) => {
      if (s.title.trim() === "") return false;
      if (s.subtasks) s.subtasks = filterEmptySubs(s.subtasks);
      return true;
    });
    const updatedTask = { ...draftTask, subtasks: filterEmptySubs(subtasks), projectId: currentProjectPrefix };
    try {
      const url = getApiUrl(`/api/tasks/${selectedTaskForModal._id}`);
      const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedTask) });
      if (res.ok) {
        toast.success("Updated!");
        closeTaskModal();
        fetchTasks();
      }
    } catch {}
  };

  const handleStartSprint = async (taskId: string) => {
    if (!window.confirm("Start sprint?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${taskId}`);
      const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "In Progress" }) });
      if (res.ok) {
        toast.success("Sprint started!");
        closeTaskModal();
        fetchTasks();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete task?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${id}`);
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted!");
        closeTaskModal();
        fetchTasks();
      }
    } catch {}
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <img src="/load.gif" alt="Loading..." className="h-70 w-100 mx-auto" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="border border-red-200 p-8 rounded-xl"><p className="text-red-600">{error}</p></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      <ToastContainer /> 
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        
        {/* ENHANCED NAVBAR */}
        <nav className="fixed top-25 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-full px-8 py-4 flex items-center space-x-10 z-20 border border-gray-100">
          
          <button 
            onClick={() => setCurrentScreen("leave")} 
            className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "leave" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}
          >
            <Palmtree className={`w-7 h-7 mb-1 ${currentScreen === "leave" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Leave</span>
          </button>

          <button 
            onClick={() => setCurrentScreen("attendance")} 
            className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "attendance" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}
          >
            <UserCheck className={`w-7 h-7 mb-1 ${currentScreen === "attendance" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Attendance</span>
          </button>

          <button 
            onClick={() => { setCurrentScreen("tasks"); setViewType("card"); }} 
            className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "card" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}
          >
            <ClipboardList className={`w-7 h-7 mb-1 ${currentScreen === "tasks" && viewType === "card" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Task List</span>
          </button>

          <button 
            onClick={() => { setCurrentScreen("tasks"); setViewType("board"); }} 
            className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "tasks" && viewType === "board" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}
          >
            <Kanban className={`w-7 h-7 mb-1 ${currentScreen === "tasks" && viewType === "board" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Board</span>
          </button>

          <button 
            onClick={() => setIsHolidaysOpen(true)} 
            className="flex flex-col items-center text-gray-400 hover:text-green-500 transition-all duration-200"
          >
            <Calendar className="w-7 h-7 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Holidays</span>
          </button>

          <button 
            onClick={() => setCurrentScreen("chat")} 
            className={`flex flex-col items-center transition-all duration-200 ${currentScreen === "chat" ? "text-green-600 scale-105" : "text-gray-400 hover:text-green-500"}`}
          >
            <MessageSquare className={`w-7 h-7 mb-1 ${currentScreen === "chat" ? "fill-green-50" : ""}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Chat</span>
          </button>
        </nav>

        <div className="max-w-[1800px] mx-auto bg-white mt-12">
          {currentScreen === "tasks" ? (
            <>
              <TaskTableHeader uniqueProjects={uniqueProjects} employees={employees} downloadFilterType={downloadFilterType} setDownloadFilterType={setDownloadFilterType} downloadFilterValue={downloadFilterValue} setDownloadFilterValue={setDownloadFilterValue} xlsxLoaded={xlsxLoaded} handleExcelDownload={() => {}} />
              {filteredTasks.length === 0 ? <div className="text-center py-16"><AlertCircle className="w-8 h-8 mx-auto text-slate-400" /><h3 className="mt-2 text-slate-700">No tasks found</h3></div> : (
                <>
                  {viewType === "card" && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">{filteredTasks.map((t) => <TaskCard key={t._id} task={t} onViewDetails={openTaskModal} />)}</div>}
                  {viewType === "board" && <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />}
                </>
              )}
              {selectedTaskForModal && <TaskModal task={selectedTaskForModal} isOpen={isModalOpen} onClose={closeTaskModal} isEditing={isEditing} draftTask={draftTask} subtasks={subtasks} employees={employees} currentProjectPrefix={currentProjectPrefix} allTaskStatuses={allTaskStatuses} handleEdit={handleEdit} handleDelete={handleDelete} handleUpdate={handleUpdate} cancelEdit={cancelEdit} handleDraftChange={handleDraftChange} handleSubtaskChange={handleSubtaskChange} addSubtask={addSubtask} removeSubtask={removeSubtask} onToggleEdit={handleToggleEdit} onToggleExpansion={handleToggleExpansion} handleStartSprint={handleStartSprint} onTaskStatusChange={onTaskStatusChange} onSubtaskStatusChange={onSubtaskStatusChange} />}
            </>
          ) : currentScreen === "leave" ? <EmpLeave /> : currentScreen === "attendance" ? <AttendancePage /> : currentScreen === "chat" ? <ComingSoon /> : null}
        </div>
      </div>
      <HolidaysModal open={isHolidaysOpen} onClose={() => setIsHolidaysOpen(false)} />
      <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="fixed bottom-6 right-6 p-4 bg-green-600 text-white rounded-full shadow-2xl z-50 hover:scale-110 transition-transform">
        {isNotesOpen ? <X className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
      </button>
      {isNotesOpen && (
        <div className="fixed bottom-24 right-6 w-200 h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-green-600 p-4 text-white font-semibold flex justify-between"><span>My Notes</span><button onClick={() => setIsNotesOpen(false)}><X className="w-4 h-4" /></button></div>
          <div className="flex-1 overflow-auto"><NotesPage /></div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;