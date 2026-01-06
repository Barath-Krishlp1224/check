"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar, X, Plus, BarChart3, Clock, User, ArrowRight, AlertCircle, Settings,
  ChevronLeft, CheckCircle2, ChevronRight, Layers, Target, FileText, Users,
  Edit2, Trash2, Save, ArrowUp, ArrowDown, KanbanSquare, List, GitBranch,
  Search, Filter, Play, MessageSquare, History, Tag, Box, Package, Timer,
  TrendingUp, ShieldCheck, Link2, Paperclip, Eye
} from "lucide-react";

// --- Types & Constants ---
type ProjectType = "Scrum" | "Kanban" | "Simple";
type IssueType = "Epic" | "Story" | "Task" | "Bug" | "Subtask";
type Priority = "Low" | "Medium" | "High" | "Critical";

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Closed" | "Future";
  goal?: string;
}

interface Subtask {
  id: string; 
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  timeSpent?: number;
  storyPoints?: number;
  date?: string;
  remarks?: string;
  subtasks?: Subtask[];
  issueType?: IssueType;
}

interface Employee {
  _id: string;
  name: string;
  empId?: string;
  team?: string;
  category?: string;
  department?: string;
  canonicalTeam?: string | null;
}

interface SavedProject {
  _id: string;
  name: string;
  key: string;
  description?: string;
  projectType: string;
  visibility: string;
  members: string[];
  ownerId: string;
  createdAt: string;
  sprints?: Sprint[];
}

interface Task {
  _id: string;
  taskId: string;
  projectId: string;
  project?: string;
  assigneeNames: string[];
  department: string;
  startDate: string;
  dueDate: string;
  endDate?: string;
  status: string;
  completion: number;
  remarks: string;
  createdAt?: string;
  subtasks?: Subtask[];
  priority?: Priority;
  backlogOrder?: number;
  issueType?: IssueType;
  epicLink?: string;
  storyPoints?: number;
  sprintId?: string;
  labels?: string[];
  components?: string[];
  fixVersions?: string[];
  originalEstimate?: number;
  timeSpent?: number;
  comments?: Comment[];
  activities?: ActivityLog[];
  watchers?: string[];
}

const DEPARTMENT_OPTIONS = [
  "Tech", "Accounts", "IT Admin", "Manager", "Admin & Operations",
  "HR", "Founders", "TL-Reporting Manager", "TL Accountant",
] as const;

const WORKFLOW_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done", "On Hold"];

const departmentAliases: Record<string, string[]> = {
  Tech: ["tech", "development", "engineering", "dev", "frontend", "backend", "software"],
  Accounts: ["accounts", "finance", "fin", "accounting"],
  "IT Admin": ["it admin", "it", "itadmin", "sysadmin", "system admin"],
  Manager: ["manager", "managers", "management"],
  "Admin & Operations": ["admin", "operations", "ops", "admin operations"],
  HR: ["hr", "human resources"],
  Founders: ["founder", "founders", "leadership", "executive"],
  "TL-Reporting Manager": ["tl", "reporting manager", "lead", "team lead"],
  "TL Accountant": ["tl accountant", "lead accountant", "senior accountant"],
};

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700"
};

const ISSUE_TYPE_COLORS: Record<IssueType, string> = {
  Epic: "bg-purple-100 text-purple-700",
  Story: "bg-green-100 text-green-700",
  Task: "bg-blue-100 text-blue-700",
  Bug: "bg-red-100 text-red-700",
  Subtask: "bg-gray-100 text-gray-600"
};

const ISSUE_TYPE_ICONS: Record<IssueType, string> = {
  Epic: "📚", Story: "📖", Task: "✓", Bug: "🐛", Subtask: "↳"
};

// --- Helper Functions ---
function normalizeToCanonicalTeam(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();
  for (const canonical of Object.keys(departmentAliases)) {
    const aliases = departmentAliases[canonical];
    if (aliases.some((a) => a === v || v.includes(a))) return canonical;
  }
  return null;
}

const calculateDaysRemaining = (dueDate: string) => {
  if (!dueDate) return "N/A";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dueDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays} days left`;
  if (diffDays === 0) return "Due today";
  return `${Math.abs(diffDays)} days overdue`;
};

// --- Child Components ---

const SubtaskItem: React.FC<{ 
  sub: Subtask; 
  level: number;
  onAddChild?: () => void;
}> = ({ sub, level, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = sub.subtasks && sub.subtasks.length > 0;
  return (
    <div className={`mt-2 ${level > 0 ? "ml-6 border-l-2 border-slate-200 pl-4" : ""}`}>
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group">
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button onClick={() => setIsExpanded(!isExpanded)}>
              <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          )}
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{sub.id}</span>
          <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{sub.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
            sub.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {sub.status}
          </span>
          <span className="text-[10px] font-black text-slate-400">{sub.completion}%</span>
          {level < 3 && onAddChild && (
            <button 
              onClick={onAddChild}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded text-blue-600"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="space-y-1">
          {sub.subtasks!.map((child, idx) => (
            <SubtaskItem key={idx} sub={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsView: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><TrendingUp size={14}/> Burndown Chart</h4>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">Active Sprint</span>
        </div>
        <div className="h-48 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-100">
           <p className="text-[10px] font-bold text-slate-300 uppercase">Generating sprint burndown...</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><BarChart3 size={14}/> Velocity Chart</h4>
        </div>
        <div className="h-48 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-100">
           <p className="text-[10px] font-bold text-slate-300 uppercase">Historical velocity data</p>
        </div>
      </div>
    </div>
  );
};

const BacklogTaskCard: React.FC<{
  task: Task;
  index: number;
  allTasks: Task[];
  onReorder: (taskId: string, direction: 'up' | 'down') => void;
  onUpdatePriority: (taskId: string, priority: Priority | undefined) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}> = ({ task, index, allTasks, onReorder, onUpdatePriority, onEdit, onDelete }) => {
  return (
    <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center gap-3 group hover:border-blue-200 transition-all">
      <div className="flex flex-col gap-1">
        <button onClick={() => onReorder(task._id, 'up')} disabled={index === 0} className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ArrowUp size={12} /></button>
        <button onClick={() => onReorder(task._id, 'down')} disabled={index === allTasks.length - 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ArrowDown size={12} /></button>
      </div>
      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">{index + 1}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.taskId}</span>
          {task.issueType && (
            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${ISSUE_TYPE_COLORS[task.issueType]}`}>
              {ISSUE_TYPE_ICONS[task.issueType]} {task.issueType}
            </span>
          )}
          <select 
            value={task.priority || 'Medium'} 
            onChange={(e) => onUpdatePriority(task._id, e.target.value as Priority)} 
            className={`text-[8px] font-black px-2 py-0.5 rounded border-0 ${PRIORITY_COLORS[task.priority || 'Medium']}`}
          >
            <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
          </select>
          {task.storyPoints && <span className="text-[8px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{task.storyPoints} SP</span>}
        </div>
        <p className="text-xs font-bold text-slate-700 line-clamp-1">{task.remarks}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && <button onClick={() => onEdit(task)} className="p-2 hover:bg-blue-50 rounded text-blue-600"><Edit2 size={14} /></button>}
        {onDelete && <button onClick={() => onDelete(task._id)} className="p-2 hover:bg-red-50 rounded text-red-600"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
};

const BacklogManager: React.FC<{
  tasks: Task[];
  onReorder: (taskId: string, direction: 'up' | 'down') => void;
  onUpdatePriority: (taskId: string, priority: Priority | undefined) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartSprint: () => void;
}> = ({ tasks, onReorder, onUpdatePriority, onEditTask, onDeleteTask, onStartSprint }) => {
  const backlogTasks = tasks.filter(t => t.status === 'Backlog').sort((a, b) => (a.backlogOrder || 999) - (b.backlogOrder || 999));
  const activeSprintTasks = tasks.filter(t => t.status !== 'Backlog' && t.status !== 'Done');

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Play size={18} fill="white"/>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Active Sprint</h3>
              <p className="text-[10px] font-bold opacity-80">Cycle Active • {activeSprintTasks.length} Issues in Progress</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase transition-all">Complete Sprint</button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><List size={14} /> Backlog</h3>
          <button onClick={onStartSprint} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl">Start Sprint</button>
        </div>
        
        {backlogTasks.length === 0 ? (
          <div className="p-12 text-center bg-white border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold text-xs uppercase tracking-widest">Product Backlog is Empty</div>
        ) : (
          backlogTasks.map((task, index) => (
            <BacklogTaskCard key={task._id} task={task} index={index} allTasks={backlogTasks} onReorder={onReorder} onUpdatePriority={onUpdatePriority} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))
        )}
      </div>
    </div>
  );
};

const BoardView: React.FC<{ 
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onTaskClick?: (task: Task) => void;
}> = ({ tasks, onStatusChange, onTaskClick }) => {
  const columns = useMemo(() => {
    const cols: Record<string, Task[]> = {};
    WORKFLOW_STATUSES.forEach(status => {
      cols[status] = tasks.filter(t => t.status === status);
    });
    return cols;
  }, [tasks]);

  return (
    <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
      {WORKFLOW_STATUSES.map(status => (
        <div key={status} className="min-w-[220px]">
          <div className="p-3 bg-slate-100 rounded-xl mb-3 flex items-center justify-between">
            <h4 className="text-[9px] font-black uppercase text-slate-600">{status}</h4>
            <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-full text-slate-400">{columns[status].length}</span>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {columns[status].map(task => (
              <div key={task._id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-300 cursor-pointer" onClick={() => onTaskClick && onTaskClick(task)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-black text-blue-600">{task.taskId}</span>
                  <div className={`w-2 h-2 rounded-full ${task.priority === 'Critical' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
                </div>
                <p className="text-[10px] font-bold text-slate-700 line-clamp-2">{task.remarks}</p>
                <div className="mt-3 flex items-center justify-between">
                   <div className="flex -space-x-2">
                     {task.assigneeNames.slice(0, 3).map((n, i) => (
                       <div key={i} className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[7px] font-black">{n[0]}</div>
                     ))}
                   </div>
                   <span className="text-[8px] font-black text-slate-300">{task.storyPoints || 0} SP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Application Component ---
export default function JiraSystem() {
  const [step, setStep] = useState("details");
  const [loading, setLoading] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "tasks" | "backlog" | "board" | "search" | "reports" | "activity">("overview");
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [message, setMessage] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [projectFormData, setProjectFormData] = useState({
    name: "", key: "", description: "", type: "Scrum" as ProjectType,
    ownerId: "user_001", members: [] as string[], visibility: "PRIVATE",
  });

  const [taskFormData, setTaskFormData] = useState({
    taskId: "", projectName: "", assigneeNames: [] as string[], department: "",
    startDate: new Date().toISOString().split("T")[0], endDate: "", dueDate: "",
    completion: "0", status: "Backlog", remarks: "", priority: "Medium" as Priority,
    issueType: "Task" as IssueType, storyPoints: "", labels: "", originalEstimate: ""
  });

  // --- Core Handlers (Restored handleStartSprint) ---

  const handleStartSprint = () => {
    setMessage("✅ Sprint Initialized. Project timeline updated.");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      taskId: task.taskId,
      projectName: task.project || "",
      assigneeNames: task.assigneeNames,
      department: task.department,
      startDate: task.startDate,
      endDate: task.endDate || "",
      dueDate: task.dueDate,
      completion: task.completion.toString(),
      status: task.status,
      remarks: task.remarks,
      priority: task.priority || "Medium",
      issueType: task.issueType || "Task",
      storyPoints: task.storyPoints?.toString() || "",
      labels: task.labels?.join(", ") || "",
      originalEstimate: task.originalEstimate?.toString() || ""
    });
    setModalTab("tasks");
  };

  const handleUpdatePriority = (taskId: string, priority: Priority | undefined) => {
    setProjectTasks(prev => prev.map(t => t._id === taskId ? { ...t, priority } : t));
  };

  const handleReorderBacklog = (taskId: string, direction: 'up' | 'down') => {
    setProjectTasks(prev => {
      const backlog = prev.filter(t => t.status === 'Backlog');
      const idx = backlog.findIndex(t => t._id === taskId);
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= backlog.length) return prev;
      const reordered = [...backlog];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
      return [...reordered, ...prev.filter(t => t.status !== 'Backlog')];
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setProjectTasks(prev => prev.filter(t => t._id !== taskId));
        setMessage("✅ Task deleted successfully.");
      }
    } catch (err) { setMessage("❌ Connectivity error."); }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setProjectTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
  };

  // --- API and Side Effects ---

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => { 
    if (selectedProject) {
      setProjectTasks([]); fetchTasksForProject(selectedProject._id);
      setTaskFormData(prev => ({ ...prev, taskId: selectedProject.key, projectName: selectedProject.name }));
    }
  }, [selectedProject]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([fetch("/api/projects"), fetch("/api/employees")]);
      const pData = await pRes.json();
      const eData = await eRes.json();
      
      setSavedProjects(Array.isArray(pData) ? pData : (pData.projects || []));

      // Handling your API structure { success: true, employees: [] }
      const rawEmployees = eData.success && Array.isArray(eData.employees) ? eData.employees : [];
      
      setEmployees(rawEmployees.map((e: any) => ({
        _id: e._id,
        name: e.name || e.displayName || "Unknown",
        department: e.department || e.team,
        canonicalTeam: normalizeToCanonicalTeam(e.department || e.team)
      })));
    } catch (err) { console.error("Initialization failed:", err); }
    finally { setLoading(false); }
  };

  const fetchTasksForProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      const data = await res.json();
      setProjectTasks(Array.isArray(data) ? data : (data.tasks || []));
    } catch (err) { setProjectTasks([]); }
  };

  const filteredAssignees = useMemo(() => {
    if (!taskFormData.department) return [];
    return employees.filter(emp => 
      emp.canonicalTeam === taskFormData.department || 
      emp.department === taskFormData.department
    );
  }, [taskFormData.department, employees]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setLoading(true);
    try {
      const payload = { 
        ...taskFormData, 
        projectId: selectedProject._id, 
        completion: Number(taskFormData.completion),
        storyPoints: Number(taskFormData.storyPoints),
        labels: taskFormData.labels.split(",").map(s => s.trim()).filter(Boolean)
      };
      const method = editingTask ? "PUT" : "POST";
      const url = editingTask ? `/api/tasks/${editingTask._id}` : "/api/tasks/add";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage(editingTask ? "✅ Issue Updated" : "✅ Issue Created");
        setEditingTask(null);
        fetchTasksForProject(selectedProject._id);
        setTimeout(() => { setModalTab("overview"); setMessage(""); }, 1500);
      }
    } catch (err) { setMessage("❌ Service unavailable"); }
    finally { setLoading(false); }
  };

  const taskStats = useMemo(() => {
    const total = projectTasks.length;
    return {
      total,
      done: projectTasks.filter(t => t.status === "Done").length,
      active: projectTasks.filter(t => t.status === "In Progress").length,
      avg: total > 0 ? Math.round(projectTasks.reduce((a, b) => a + b.completion, 0) / total) : 0
    };
  }, [projectTasks]);

  const formElementClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black bg-slate-50 transition-all font-medium";

  return (
    <div className="min-h-screen bg-[#F4F7FA] p-4 lg:p-10 font-sans text-slate-900 flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* BUILDER SIDE */}
        <main className="flex-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 lg:p-12 flex-1">
              <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">JS</div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Engine</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase"><ShieldCheck size={12}/> Jira Engine Active</div>
              </header>

              {step === "details" && (
                <div className="max-w-xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Project Name</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold" placeholder="e.g. Apollo Phase 2" value={projectFormData.name} onChange={(e) => {
                      const name = e.target.value;
                      const key = name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 5);
                      setProjectFormData({...projectFormData, name, key});
                    }} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Key</label>
                      <input className="w-full px-6 py-4 bg-slate-100 rounded-2xl font-black text-slate-600 uppercase" value={projectFormData.key} readOnly />
                    </div>
                    <div className="flex-[2] space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Visibility</label>
                       <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={projectFormData.visibility} onChange={(e) => setProjectFormData({...projectFormData, visibility: e.target.value})}>
                         <option value="PRIVATE">Private Workspace</option><option value="PUBLIC">Public Workspace</option>
                       </select>
                    </div>
                  </div>
                </div>
              )}

              {step === "team" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><Users size={16}/> Team Provisioning</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {employees.map((emp) => (
                      <div key={emp._id} onClick={() => {
                        const ids = projectFormData.members.includes(emp._id) ? projectFormData.members.filter(m => m !== emp._id) : [...projectFormData.members, emp._id];
                        setProjectFormData({ ...projectFormData, members: ids });
                      }} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${projectFormData.members.includes(emp._id) ? "border-blue-600 bg-blue-50" : "border-slate-50 hover:border-slate-200"}`}>
                        <p className="text-xs font-black truncate">{emp.name}</p>
                        <p className="text-[8px] text-slate-400 uppercase font-bold">{emp.department || "Staff"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === "config" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["Scrum", "Kanban"].map((t) => (
                    <div key={t} onClick={() => setProjectFormData({ ...projectFormData, type: t as ProjectType })} className={`p-10 border-2 rounded-[3rem] cursor-pointer transition-all ${projectFormData.type === t ? "border-blue-600 bg-blue-50" : "border-slate-100 bg-white"}`}>
                      <h3 className="font-black text-xl mb-3">{t}</h3>
                      <p className="text-xs text-slate-400 font-medium">{t === 'Scrum' ? 'Sprints & Story Points.' : 'Continuous Flow & WIP.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between">
              <button onClick={() => setStep(step === "team" ? "details" : "team")} className={`px-8 py-3 text-xs font-black uppercase text-slate-400 ${step === 'details' ? 'invisible' : ''}`}>Back</button>
              <button onClick={() => step === "config" ? (setStep("details"), fetchInitialData()) : setStep(step === "details" ? "team" : "config")} disabled={!projectFormData.name} className="px-12 py-4 bg-slate-900 text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
                {step === "config" ? "Initialize" : "Next"}
              </button>
            </div>
          </div>
        </main>

        <aside className="w-full lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Filters</h2>
            <div className="space-y-3">
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full text-[10px] p-3 bg-slate-50 rounded-xl font-bold" />
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full text-[10px] p-3 bg-slate-50 rounded-xl font-bold" />
            </div>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {savedProjects.map((proj) => (
              <div key={proj._id} onClick={() => setSelectedProject(proj)} className={`p-5 border rounded-2xl flex items-center gap-4 cursor-pointer transition-all group ${selectedProject?._id === proj._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${selectedProject?._id === proj._id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{proj.key}</div>
                <div className="truncate flex-1">
                  <p className="text-sm font-black text-slate-800 truncate">{proj.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">{proj.projectType}</p>
                </div>
                <ArrowRight size={14} className={selectedProject?._id === proj._id ? 'text-blue-500' : 'text-slate-300'} />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedProject(null)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="px-10 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><ChevronLeft size={24} /></button>
                <h2 className="text-2xl font-black text-slate-800">{selectedProject.name} <span className="text-blue-500 ml-2 font-medium">({selectedProject.key})</span></h2>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto custom-scrollbar">
                {[
                  {id: "overview", label: "Insights", icon: <TrendingUp size={12}/>},
                  {id: "backlog", label: "Backlog", icon: <List size={12}/>},
                  {id: "board", label: "Board", icon: <KanbanSquare size={12}/>},
                  {id: "reports", label: "Reports", icon: <BarChart3 size={12}/>},
                  {id: "activity", label: "Activity", icon: <History size={12}/>},
                  {id: "search", label: "Search", icon: <Search size={12}/>},
                  {id: "tasks", label: "Create", icon: <Plus size={12}/>}
                ].map(tab => (
                  <button key={tab.id} onClick={() => setModalTab(tab.id as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${modalTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F8F9FB] p-6 lg:p-10 custom-scrollbar">
              {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 font-bold text-xs flex items-center gap-2"><CheckCircle2 size={16}/> {message}</div>}

              {modalTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      {[{l: "Issues", v: taskStats.total}, {l: "Done", v: taskStats.done}, {l: "Active", v: taskStats.active}, {l: "Health", v: `${taskStats.avg}%`}].map(s => (
                        <div key={s.l} className="bg-white p-5 rounded-3xl border border-slate-100">
                          <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{s.l}</p>
                          <p className="text-xl font-black text-slate-800">{s.v}</p>
                        </div>
                      ))}
                    </div>
                    {projectTasks.map(task => (
                        <div key={task._id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.taskId}</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded ${PRIORITY_COLORS[task.priority || 'Medium']}`}>{task.priority}</span>
                                <div className="text-[9px] text-orange-500 font-black px-2 py-1 bg-orange-50 rounded flex items-center gap-1"><Clock size={10}/> {calculateDaysRemaining(task.dueDate)}</div>
                              </div>
                              <p className="text-sm font-bold text-slate-800 mb-2">{task.remarks}</p>
                              <div className="flex gap-2">
                                 {task.labels?.map(l => <span key={l} className="text-[8px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">#{l}</span>)}
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase">Workflow</p>
                               <span className="text-xs font-black text-slate-800">{task.status}</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <button className="text-[9px] font-black text-slate-400 flex items-center gap-1"><MessageSquare size={12}/> {task.comments?.length || 0}</button>
                                <button className="text-[9px] font-black text-slate-400 flex items-center gap-1"><Link2 size={12}/> {task.subtasks?.length || 0}</button>
                             </div>
                             <button onClick={() => handleEditTask(task)} className="text-[9px] font-black text-blue-600 uppercase">Review</button>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                        <div className="flex items-center gap-2 mb-6"><Box className="text-blue-400" size={20}/> <h4 className="text-xs font-black uppercase tracking-widest">Metadata</h4></div>
                        <div className="space-y-4">
                           <div className="flex justify-between text-[10px] pb-3 border-b border-slate-800"><span className="text-slate-400">Framework</span><span className="font-bold">{selectedProject.projectType}</span></div>
                           <div className="flex justify-between text-[10px] pb-3 border-b border-slate-800"><span className="text-slate-400">Project Key</span><span className="font-bold">{selectedProject.key}</span></div>
                           <div className="flex justify-between text-[10px]"><span className="text-slate-400">Created</span><span className="font-bold">{new Date(selectedProject.createdAt).toLocaleDateString()}</span></div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {modalTab === "backlog" && <BacklogManager tasks={projectTasks} onReorder={handleReorderBacklog} onUpdatePriority={handleUpdatePriority} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} onStartSprint={handleStartSprint} />}
              {modalTab === "board" && <BoardView tasks={projectTasks} onTaskClick={handleEditTask} onStatusChange={handleStatusChange} />}
              {modalTab === "reports" && <ReportsView tasks={projectTasks} />}
              
              {modalTab === "activity" && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black">AI</div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Issue <span className="text-blue-600">{selectedProject.key}-0{i}</span> state synchronized via Engine.</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1">Recently</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === "tasks" && (
                <div className="max-w-5xl mx-auto pb-10">
                  <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                        <div>
                           <div className="flex items-center gap-2 mb-4 text-slate-800"><Target size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Metadata</h2></div>
                           <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Issue ID</label><input type="text" value={taskFormData.taskId} onChange={(e) => setTaskFormData({...taskFormData, taskId: e.target.value})} className={formElementClass} /></div>
                             <div>
                               <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Type</label>
                               <select value={taskFormData.issueType} onChange={(e) => setTaskFormData({...taskFormData, issueType: e.target.value as IssueType})} className={formElementClass}>
                                 <option value="Epic">📚 Epic</option><option value="Story">📖 Story</option><option value="Task">✓ Task</option><option value="Bug">🐛 Bug</option>
                               </select>
                             </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4 mt-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Labels</label><input type="text" value={taskFormData.labels} onChange={(e) => setTaskFormData({...taskFormData, labels: e.target.value})} className={formElementClass} placeholder="e.g. backend, ui" /></div>
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Story Points</label><input type="number" value={taskFormData.storyPoints} onChange={(e) => setTaskFormData({...taskFormData, storyPoints: e.target.value})} className={formElementClass} /></div>
                           </div>
                        </div>

                        <div className="h-px bg-slate-100" />
                        
                        <div>
                           <div className="flex items-center gap-2 mb-4 text-slate-800"><Timer size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Resource Allocation</h2></div>
                           <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Original Estimate (h)</label><input type="number" value={taskFormData.originalEstimate} onChange={(e) => setTaskFormData({...taskFormData, originalEstimate: e.target.value})} className={formElementClass} /></div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Department</label>
                                <select value={taskFormData.department} onChange={(e) => setTaskFormData({...taskFormData, department: e.target.value, assigneeNames: []})} className={formElementClass}>
                                  <option value="">Select Dept</option>
                                  {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                           </div>
                        </div>

                        {/* ASSIGNEES */}
                        <div className="h-px bg-slate-100" />
                        <div>
                          <div className="flex items-center gap-2 mb-4 text-slate-800"><Users size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Assignees</h2></div>
                          {!taskFormData.department ? (
                            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-slate-300 uppercase">Select Department to View Resources</div>
                          ) : filteredAssignees.length === 0 ? (
                            <div className="p-8 text-center bg-red-50 border-2 border-dashed border-red-100 rounded-2xl text-[10px] font-black text-red-300 uppercase">No resources found in {taskFormData.department}</div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                              {filteredAssignees.map(emp => (
                                <label key={emp._id} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border-2 transition-all ${taskFormData.assigneeNames.includes(emp.name) ? 'border-blue-500 bg-blue-50' : 'border-slate-50 hover:border-slate-100'}`}>
                                  <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={taskFormData.assigneeNames.includes(emp.name)} 
                                    onChange={(e) => {
                                      const names = e.target.checked 
                                        ? [...taskFormData.assigneeNames, emp.name] 
                                        : taskFormData.assigneeNames.filter(n => n !== emp.name);
                                      setTaskFormData({...taskFormData, assigneeNames: names});
                                    }} 
                                  />
                                  <div className="flex-1"><p className="text-xs font-black text-slate-700">{emp.name}</p></div>
                                  {taskFormData.assigneeNames.includes(emp.name) && <CheckCircle2 size={14} className="text-blue-500" />}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="h-px bg-slate-100" />
                        <div>
                           <div className="flex items-center gap-2 mb-4 text-slate-800"><Calendar size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Timeline</h2></div>
                           <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Start</label><input type="date" value={taskFormData.startDate} onChange={(e) => setTaskFormData({...taskFormData, startDate: e.target.value})} className={formElementClass} /></div>
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Deadline</label><input type="date" value={taskFormData.dueDate} onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})} className={formElementClass} /></div>
                           </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-slate-800"><BarChart3 size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Status Management</h2></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">State</label><select value={taskFormData.status} onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value})} className={formElementClass}>{WORKFLOW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Priority</label><select value={taskFormData.priority} onChange={(e) => setTaskFormData({...taskFormData, priority: e.target.value as Priority})} className={formElementClass}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                      </div>
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-slate-800"><FileText size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Brief</h2></div>
                        <textarea rows={6} value={taskFormData.remarks} onChange={(e) => setTaskFormData({...taskFormData, remarks: e.target.value})} className={`${formElementClass} resize-none`} placeholder="Objective details..." />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                        {editingTask ? <Save size={14}/> : <Plus size={14}/>} {editingTask ? 'Apply Synchronized Update' : 'Publish Issue'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}