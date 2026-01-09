"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ClipboardList,
  Kanban,
  Layers,
  Search,
  Trello,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Component Imports
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";

// Types & Utils
import { Task, Subtask, Employee } from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board";
type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

const allTaskStatuses = [
  "Backlog", "To Do", "In Progress", "Dev Review", "Deployed in QA", 
  "Test In Progress", "QA Sign Off", "Deployment Stage", 
  "Pilot Test", "Completed", "Paused",
];

const TasksPage: React.FC = () => {
  // --- Data States ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("Employee");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string>("");

  // --- UI Navigation ---
  const [viewType, setViewType] = useState<ViewType>("board");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // --- Task Editing ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") return `${window.location.origin}${path}`;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${path}`;
  };

  // Fetch tasks with employee filtering - UPDATED WITH BETTER DEBUGGING
  const fetchTasks = useCallback(async () => {
    try {
      console.log("Fetching tasks...");
      setDebugInfo("Fetching tasks from API...");
      
      const res = await fetch(getApiUrl("/api/tasks"));
      const data = await res.json();
      
      console.log("API Response:", data);
      setDebugInfo(`API Response: ${JSON.stringify(data).substring(0, 100)}...`);
      
      if (res.ok) {
        let taskData: Task[] = [];
        
        // Handle different response formats
        if (Array.isArray(data)) {
          taskData = data;
        } else if (data && Array.isArray(data.tasks)) {
          taskData = data.tasks;
        } else if (data && Array.isArray(data.data)) {
          taskData = data.data;
        } else if (data && data.success && Array.isArray(data.data)) {
          taskData = data.data;
        } else if (data && data.task) {
          taskData = [data.task];
        }
        
        console.log(`Parsed ${taskData.length} tasks:`, taskData);
        setDebugInfo(`Parsed ${taskData.length} tasks from API`);
        
        // Filter tasks based on user role
        let filteredTasks = taskData || [];
        
        if (currentUserRole === "Employee" && currentUserName) {
          console.log("Filtering tasks for employee:", currentUserName);
          filteredTasks = filteredTasks.filter((task: Task) => {
            const assigneeNames = task.assigneeNames || [];
            const assigneeIds = task.assigneeIds || [];
            
            console.log(`Task ${task.taskId || task._id}:`, {
              assigneeNames,
              assigneeIds,
              currentUserName,
              currentUserId
            });
            
            const assigneeMatches = assigneeNames.some(
              name => name.toLowerCase() === currentUserName.toLowerCase()
            );
            
            const assigneeIdMatches = assigneeIds.some(
              id => id === currentUserId
            );
            
            const isAssigned = assigneeMatches || assigneeIdMatches;
            console.log(`Task ${task.taskId || task._id} assigned to user: ${isAssigned}`);
            
            return isAssigned;
          });
          
          console.log(`Filtered to ${filteredTasks.length} tasks for employee`);
          setDebugInfo(`Filtered to ${filteredTasks.length} tasks for employee ${currentUserName}`);
        } else {
          console.log(`Showing all ${filteredTasks.length} tasks for ${currentUserRole}`);
          setDebugInfo(`Showing all ${filteredTasks.length} tasks for ${currentUserRole}`);
        }
        
        setTasks(filteredTasks);
      } else {
        console.error("API Error:", data);
        setDebugInfo(`API Error: ${data.error || data.message || "Unknown error"}`);
        toast.error(`Failed to load tasks: ${data.error || data.message || "Unknown error"}`);
      }
    } catch (err: any) { 
      console.error("Failed to fetch tasks:", err);
      setDebugInfo(`Fetch error: ${err.message}`);
      toast.error("Database connection lost"); 
    } finally { 
      setLoading(false); 
    }
  }, [currentUserRole, currentUserName, currentUserId]);

  const fetchEmployees = async () => {
    try {
      console.log("Fetching employees...");
      const res = await fetch(getApiUrl("/api/employees"));
      const data = await res.json();
      if (res.ok && data.success) {
        console.log(`Fetched ${data.employees?.length || 0} employees`);
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  // --- Recursive Subtask Management ---
  const getNewSubtask = (prefix: string, pathStr: string): Subtask => ({
    id: `${prefix}-SUB-${pathStr}-${Math.floor(Math.random() * 1000)}`,
    title: "",
    assigneeName: currentUserName, // Default to current user for subtasks
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
        return { ...item, subtasks: traverse(item.subtasks || [], rest) };
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

  const onTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) { 
        await fetchTasks();
        toast.info(`Status updated to: ${newStatus}`); 
      }
    } catch (err) { 
      console.error("Failed to update task status:", err);
      toast.error("Update failed"); 
    }
  }, [fetchTasks]);

  const onSubtaskStatusChange = useCallback(async (taskId: string, subtaskId: string | null, newStatus: string) => {
    if (!subtaskId) return;
    
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
    } catch (err) {
      console.error("Failed to update subtask status:", err);
      toast.error("Update failed");
    }
  }, [tasks, fetchTasks]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;
    
    try {
      // Check if user is authorized to edit this task
      if (currentUserRole === "Employee") {
        const isAssigned = selectedTaskForModal.assigneeNames?.some(
          name => name.toLowerCase() === currentUserName.toLowerCase()
        ) || selectedTaskForModal.assigneeIds?.some(id => id === currentUserId);
        
        if (!isAssigned) {
          toast.error("You are not authorized to edit this task");
          return;
        }
      }
      
      const res = await fetch(getApiUrl(`/api/tasks/${selectedTaskForModal._id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftTask, subtasks }),
      });
      
      if (res.ok) {
        toast.success("Task updated successfully");
        await fetchTasks();
        closeTaskModal();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Update failed");
      }
    } catch (err) { 
      console.error("Failed to update task:", err);
      toast.error("Sync failed"); 
    }
  };

  const handleDelete = async (id: string) => {
    if (currentUserRole === "Employee") {
      toast.error("Employees cannot delete tasks");
      return;
    }
    
    if (!window.confirm("Permanent delete? This cannot be undone.")) return;
    
    try {
      const res = await fetch(getApiUrl(`/api/tasks/${id}`), { method: "DELETE" });
      if (res.ok) {
        toast.success("Task removed");
        await fetchTasks();
        closeTaskModal();
      }
    } catch (err) { 
      console.error("Failed to delete task:", err);
      toast.error("Delete failed"); 
    }
  };

  // Initialize user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole");
      const name = localStorage.getItem("userName");
      const id = localStorage.getItem("userId");
      
      console.log("LocalStorage data:", { role, name, id });
      
      setCurrentUserRole(role === "Admin" || role === "Manager" || role === "TeamLead" ? role : "Employee");
      setCurrentUserName(name || "");
      setCurrentUserId(id || "");
      
      // Set debug info
      setDebugInfo(`User: ${name} (${role}), ID: ${id}`);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    const init = async () => {
      console.log("Initializing page...");
      setLoading(true);
      await Promise.all([fetchTasks(), fetchEmployees()]);
      console.log("Initialization complete");
    };
    init();
  }, [fetchTasks]);

  // Filter tasks based on role and search
  const filteredTasks = useMemo(() => {
    console.log("Filtering tasks...");
    console.log("Total tasks:", tasks.length);
    console.log("Current user:", { currentUserRole, currentUserName, currentUserId });
    
    let base = tasks;
    
    // Apply role-based filtering
    if (currentUserRole === "Employee" && currentUserName) {
      base = base.filter(t => {
        const assigneeNames = t.assigneeNames || [];
        const assigneeIds = t.assigneeIds || [];
        
        const assigneeMatches = assigneeNames.some(
          name => name.toLowerCase() === currentUserName.toLowerCase()
        );
        const assigneeIdMatches = assigneeIds.some(
          id => id === currentUserId
        );
        
        const isAssigned = assigneeMatches || assigneeIdMatches;
        
        if (isAssigned) {
          console.log(`Task ${t.taskId || t._id} assigned to user`);
        }
        
        return isAssigned;
      });
      
      console.log(`Employee view: ${base.length} tasks after filtering`);
    } else {
      console.log(`Admin/Manager view: ${base.length} tasks`);
    }
    
    // Apply search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      base = base.filter(t => 
        (t.remarks?.toLowerCase() || "").includes(s) || 
        (t.taskId?.toLowerCase() || "").includes(s) || 
        (t.project?.toLowerCase() || "").includes(s) ||
        (t.summary?.toLowerCase() || "").includes(s)
      );
      console.log(`After search: ${base.length} tasks`);
    }
    
    // Apply status filter
    if (statusFilter) {
      base = base.filter(t => t.status === statusFilter);
      console.log(`After status filter: ${base.length} tasks`);
    }
    
    console.log(`Final filtered tasks: ${base.length}`);
    return base;
  }, [tasks, currentUserRole, currentUserName, currentUserId, searchTerm, statusFilter]);

  // Stats for employee dashboard
  const taskStats = useMemo(() => {
    const employeeTasks = filteredTasks.filter(t => {
      const assigneeMatches = t.assigneeNames?.some(
        name => name.toLowerCase() === currentUserName.toLowerCase()
      );
      const assigneeIdMatches = t.assigneeIds?.some(id => id === currentUserId);
      return assigneeMatches || assigneeIdMatches;
    });
    
    return {
      total: employeeTasks.length,
      completed: employeeTasks.filter(t => t.status === "Completed").length,
      inProgress: employeeTasks.filter(t => t.status === "In Progress").length,
      todo: employeeTasks.filter(t => t.status === "To Do" || t.status === "Backlog").length,
    };
  }, [filteredTasks, currentUserName, currentUserId]);

  // Add a manual refresh button for debugging
  const handleRefresh = async () => {
    setLoading(true);
    await fetchTasks();
    toast.info("Tasks refreshed");
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <span className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Loading Workspace</span>
      {debugInfo && (
        <div className="mt-4 text-xs text-slate-500 max-w-md text-center">
          {debugInfo}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <ToastContainer position="top-right" autoClose={2000} theme="dark" /> 
      
      {/* Simplified Navigation - Toggle between Board and List */}
      <nav className="fixed top-25 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] rounded-full px-8 py-4 flex items-center space-x-8 z-[100] border border-white/50">
        <button 
          onClick={() => setViewType("board")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${viewType === 'board' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-500'}`}
        >
          <Kanban size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">Board View</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <button 
          onClick={() => setViewType("card")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${viewType === 'card' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-500'}`}
        >
          <ClipboardList size={18} />
          <span className="text-xs font-bold uppercase tracking-wider">List View</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 transition-all"
          />
        </div>
        
        <div className="relative flex items-center">
          <Filter className="absolute left-3 w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-36 transition-all appearance-none"
          >
            <option value="">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
          </select>
        </div>

        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-900 transition-colors"
          title="Refresh tasks"
        >
          <RefreshCw size={16} />
          <span className="text-xs font-bold">Refresh</span>
        </button>
      </nav>

      <main className="flex-1 min-h-screen pb-20 px-6 sm:px-10 lg:px-16 pt-44">
        <div className="max-w-[1750px] mx-auto">
          <div className="space-y-12">
            {/* Debug Info - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-yellow-800">Debug Information</h4>
                  <button 
                    onClick={() => console.log({ tasks, filteredTasks, currentUserRole, currentUserName, currentUserId })}
                    className="text-xs text-yellow-600 hover:text-yellow-800"
                  >
                    Log to Console
                  </button>
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>Total Tasks: {tasks.length}</div>
                  <div>Filtered Tasks: {filteredTasks.length}</div>
                  <div>User: {currentUserName} ({currentUserRole})</div>
                  <div>User ID: {currentUserId}</div>
                  <div>Debug: {debugInfo}</div>
                </div>
              </div>
            )}

            {/* Header with User Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 px-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-blue-600">
                  <Layers size={22} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    {currentUserRole === "Employee" ? "My Work Dashboard" : "Operational Flow"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
                    {currentUserRole === "Employee" ? "My Tasks" : "Workspace"}
                  </h1>
                  {currentUserRole === "Employee" && (
                    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                      <User size={16} className="text-blue-600" />
                      <span className="text-sm font-bold text-blue-800">{currentUserName}</span>
                    </div>
                  )}
                </div>
                <p className="text-slate-500 font-medium text-xl">
                  {currentUserRole === "Employee" 
                    ? `Active Tasks Assigned to You (${taskStats.total})`
                    : `Active Task Management (${filteredTasks.length})`
                  }
                </p>
              </div>
              
              {currentUserRole === "Employee" && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-xs font-bold text-slate-500">Completed</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{taskStats.completed}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-500">In Progress</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{taskStats.inProgress}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="text-orange-500" />
                      <span className="text-xs font-bold text-slate-500">To Do</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{taskStats.todo}</p>
                  </div>
                </div>
              )}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner text-center">
                <Trello className="w-24 h-24 text-slate-100 mb-8" />
                <h3 className="text-3xl font-black text-slate-300 uppercase tracking-widest">
                  {currentUserRole === "Employee" ? "No Tasks Assigned" : "No Tasks Found"}
                </h3>
                <p className="text-slate-400 mt-2 font-medium max-w-sm">
                  {currentUserRole === "Employee" 
                    ? `You don't have any tasks assigned to you yet (${currentUserName}).`
                    : "No tasks were found matching your current filters."
                  }
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw size={16} />
                    Refresh Tasks
                  </button>
                  <p className="text-xs text-slate-500 mt-2">
                    Total tasks in system: {tasks.length}
                  </p>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-slate-500">
                    Showing {filteredTasks.length} of {tasks.length} tasks
                  </div>
                  <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>
                </div>
                
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
                handleStartSprint={() => {}} // Placeholder if needed
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
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TasksPage;