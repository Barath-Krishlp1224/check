"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  X,
  Plus,
  BarChart3,
  Clock,
  User,
  ArrowRight,
  AlertCircle,
  Settings,
  ChevronLeft,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  Layers,
  Target,
  FileText,
  Users,
  Edit2,
  Trash2,
  Save
} from "lucide-react";

// --- Types & Constants ---
type ProjectType = "Scrum" | "Kanban" | "Simple";

interface Subtask {
  id: string; 
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  timeSpent?: number | string;
  storyPoints?: number | string;
  date?: string;
  remarks?: string;
  subtasks?: Subtask[];
}

interface Employee {
  _id: string;
  name: string;
  empId?: string;
  team?: string;
  category?: string;
  department?: string;
  canonicalTeam?: string;
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
}

const DEPARTMENT_OPTIONS = [
  "Tech", "Accounts", "IT Admin", "Manager", "Admin & Operations",
  "HR", "Founders", "TL-Reporting Manager", "TL Accountant",
] as const;

const departmentAliases: Record<string, string[]> = {
  Tech: ["tech", "development", "engineering", "dev", "frontend", "backend"],
  Accounts: ["accounts", "finance", "fin"],
  "IT Admin": ["it admin", "it", "itadmin", "sysadmin", "system admin"],
  Manager: ["manager", "managers"],
  "Admin & Operations": ["admin", "operations", "ops", "admin & operations", "admin operations"],
  HR: ["hr", "human resources", "human-resources"],
  Founders: ["founder", "founders", "leadership"],
  "TL-Reporting Manager": ["tl", "reporting manager", "tl-reporting manager", "tl-reporting"],
  "TL Accountant": ["tl accountant", "lead accountant", "tl-accounts", "senior accountant"],
};

// --- Helper Functions ---
function normalizeToCanonicalTeam(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();
  for (const canonical of Object.keys(departmentAliases)) {
    const aliases = departmentAliases[canonical];
    if (aliases.some((a) => a === v)) return canonical;
  }
  for (const canonical of Object.keys(departmentAliases)) {
    const aliases = departmentAliases[canonical];
    if (aliases.some((a) => v.includes(a))) return canonical;
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

// --- Sub-components ---
const SubtaskItem: React.FC<{ sub: Subtask; level: number }> = ({ sub, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = sub.subtasks && sub.subtasks.length > 0;
  return (
    <div className={`mt-2 ${level > 0 ? "ml-6 border-l-2 border-slate-200 pl-4" : ""}`}>
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
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

// --- Main Component ---
export default function JiraSystem() {
  const [step, setStep] = useState("details");
  const [loading, setLoading] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [modalTab, setModalTab] = useState<"overview" | "tasks">("overview");
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [message, setMessage] = useState<string>("");

  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectData, setEditProjectData] = useState({ name: "", key: "" });

  const [projectFormData, setProjectFormData] = useState({
    name: "", key: "", description: "", type: "Scrum" as ProjectType,
    ownerId: "user_001", members: [] as string[], visibility: "PRIVATE",
  });

  const [taskFormData, setTaskFormData] = useState({
    taskId: "",
    projectName: "",
    assigneeNames: [] as string[],
    department: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dueDate: "",
    completion: "",
    status: "Backlog",
    remarks: "",
  });

  // 1. Initial Load
  useEffect(() => { fetchInitialData(); }, []);

  // 2. PROJECT SWITCH LOGIC: 
  // This effect ensures that every time a user clicks a different project, 
  // the task list is cleared immediately and then re-fetched for the specific ID.
  useEffect(() => { 
    if (selectedProject) {
      // RESET: Clear previous project's tasks immediately so they don't "flicker"
      setProjectTasks([]); 
      setMessage("");
      
      // FETCH: Only for this project
      fetchTasksForProject(selectedProject._id);

      // FORM SYNC: Update task form to match current project
      setTaskFormData(prev => ({
        ...prev,
        taskId: selectedProject.key,
        projectName: selectedProject.name
      }));
      setEditProjectData({ name: selectedProject.name, key: selectedProject.key });
    } else {
      setProjectTasks([]); // Clear if modal closes
    }
  }, [selectedProject]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([fetch("/api/projects"), fetch("/api/employees")]);
      const pData = await pRes.json();
      const eData = await eRes.json();
      setSavedProjects(Array.isArray(pData) ? pData : []);
      const rawEmployees = Array.isArray(eData?.employees) ? eData.employees : eData?.data ?? [];
      const normalized = rawEmployees.map((e: any) => ({
        _id: e._id ?? e.id ?? String(Math.random()),
        name: e.name ?? "Unknown",
        empId: e.empId ?? "",
        team: (e.team ?? e.department ?? "").toString(),
        department: e.department ?? "",
        canonicalTeam: normalizeToCanonicalTeam(e.team ?? e.department) ?? undefined,
      }));
      setEmployees(normalized);
    } catch (err) { console.error("Data fetch error:", err); }
    finally { setLoading(false); }
  };

  const fetchTasksForProject = async (projectId: string) => {
    try {
      // Ensure the API call explicitly uses the projectId
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      const data = await res.json();
      const tasks = Array.isArray(data) ? data : (data.tasks || []);
      
      // DOUBLE-CHECK: Only update state if the selected project is still the one we fetched for
      // (This prevents race conditions if a user clicks projects very fast)
      setProjectTasks(tasks);
    } catch (err) { 
      setProjectTasks([]); 
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: selectedProject._id,
          name: editProjectData.name,
          key: editProjectData.key,
        }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setIsEditingProject(false);
        fetchInitialData();
        setSelectedProject(updated);
        setMessage("✅ Project updated successfully!");
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.error || "Failed to update"}`);
      }
    } catch (error) { 
      setMessage("❌ Connection error.");
    } finally { 
      setLoading(false); 
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    if (!confirm(`Delete project "${selectedProject.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?id=${selectedProject._id}`, { 
        method: "DELETE" 
      });
      if (res.ok) {
        setSelectedProject(null);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) { 
        console.error(error); 
    } finally { 
        setLoading(false); 
    }
  };

  const filteredAssignees = useMemo(() => {
    const dept = taskFormData.department?.trim();
    if (!dept || employees.length === 0) return [];
    const canonicalSelected = normalizeToCanonicalTeam(dept);
    const canonicalSelectedLower = canonicalSelected ? canonicalSelected.toLowerCase() : "";

    if (canonicalSelected) {
      let matched = employees.filter(e => (e.canonicalTeam ?? "").toLowerCase() === canonicalSelectedLower);
      if (canonicalSelectedLower === "accounts") {
        const tl = employees.filter(e => (e.canonicalTeam ?? "").toLowerCase() === "tl accountant");
        matched = Array.from(new Set([...matched, ...tl].map(e => e._id))).map(id => [...matched, ...tl].find(e => e._id === id)!);
      }
      if (matched.length > 0) return matched;
    }
    return employees.filter(e => 
      (e.team ?? "").toLowerCase().includes(dept.toLowerCase()) || 
      (e.department ?? "").toLowerCase().includes(dept.toLowerCase())
    );
  }, [taskFormData.department, employees]);

  const handleNameChange = (name: string) => {
    const cleanName = name.trim();
    let generatedKey = "";
    if (cleanName.length > 0) {
      const words = cleanName.split(/\s+/);
      generatedKey = words.length === 1 ? words[0].slice(0, 3) : words.map(w => w[0]).join("");
    }
    setProjectFormData({ ...projectFormData, name, key: generatedKey.toUpperCase().slice(0, 5) });
  };

  const createProject = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projectFormData, projectType: projectFormData.type }),
      });
      if (res.ok) {
        setProjectFormData({ name: "", key: "", description: "", type: "Scrum", ownerId: "user_001", members: [], visibility: "PRIVATE" });
        setStep("details");
        fetchInitialData();
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setMessage("");
    if (taskFormData.assigneeNames.length === 0) {
      setMessage("❌ Please select at least one Assignee.");
      return;
    }
    setLoading(true);
    try {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const finalTaskId = `${taskFormData.taskId}-${uniqueSuffix}`;
      const payload = {
        ...taskFormData,
        projectId: selectedProject._id, // LINKED TO CURRENT PROJECT
        taskId: finalTaskId,
        completion: taskFormData.completion === "" ? 0 : Number(taskFormData.completion),
      };
      const res = await fetch("/api/tasks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage("✅ Task created successfully!");
        setTaskFormData({ ...taskFormData, assigneeNames: [], completion: "", remarks: "", status: "Backlog" });
        fetchTasksForProject(selectedProject._id);
        setTimeout(() => { setModalTab("overview"); setMessage(""); }, 1500);
      }
    } catch (err) { setMessage("❌ Connection failed."); }
    finally { setLoading(false); }
  };

  const taskStats = useMemo(() => {
    const total = projectTasks.length;
    return {
      total,
      done: projectTasks.filter(t => t.status === "Completed").length,
      active: projectTasks.filter(t => t.status === "In Progress").length,
      avg: total > 0 ? Math.round(projectTasks.reduce((a, b) => a + b.completion, 0) / total) : 0
    };
  }, [projectTasks]);

  const filteredProjects = useMemo(() => {
    return savedProjects.filter((proj) => {
      const pDate = new Date(proj.createdAt).getTime();
      const start = startDateFilter ? new Date(startDateFilter).getTime() : -Infinity;
      const end = endDateFilter ? new Date(endDateFilter).getTime() : Infinity;
      return pDate >= start && pDate <= end;
    });
  }, [savedProjects, startDateFilter, endDateFilter]);

  const formElementClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-400 bg-slate-50 transition-all font-medium";

  return (
    <div className="min-h-screen bg-[#F4F7FA] p-4 lg:p-10 font-sans text-slate-900 flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* BUILDER SIDE */}
        <main className="flex-1">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-8 lg:p-12 flex-1">
              <header className="mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">JS</div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Builder</h1>
                </div>
              </header>

              {step === "details" && (
                <div className="max-w-xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Project Name</label>
                    <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold" placeholder="e.g. Website Redesign" value={projectFormData.name} onChange={(e) => handleNameChange(e.target.value)} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Key (Code)</label>
                      <input className="w-full px-6 py-4 bg-slate-100 rounded-2xl font-black text-slate-600 uppercase" value={projectFormData.key} readOnly />
                    </div>
                    <div className="flex-[2] space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Visibility</label>
                       <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm" value={projectFormData.visibility} onChange={(e) => setProjectFormData({...projectFormData, visibility: e.target.value})}>
                         <option value="PRIVATE">Private</option>
                         <option value="PUBLIC">Public</option>
                       </select>
                    </div>
                  </div>
                </div>
              )}

              {step === "team" && (
                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase">Select Workspace Members</h3>
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
                      <p className="text-xs text-slate-400 font-medium">Manage tasks with sprints or continuous flow.</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between">
              <button onClick={() => setStep(step === "team" ? "details" : "team")} className={`px-8 py-3 text-xs font-black uppercase text-slate-400 ${step === 'details' ? 'invisible' : ''}`}>Back</button>
              <button onClick={() => step === "config" ? createProject() : setStep(step === "details" ? "team" : "config")} disabled={!projectFormData.name} className="px-12 py-4 bg-slate-900 text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
                {step === "config" ? "Create Project" : "Next Step"}
              </button>
            </div>
          </div>
        </main>

        {/* LIST SIDE */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Search & Filters</h2>
            <div className="space-y-3">
              <input type="date" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full text-[10px] p-3 bg-slate-50 rounded-xl outline-none font-bold" />
              <input type="date" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full text-[10px] p-3 bg-slate-50 rounded-xl outline-none font-bold" />
            </div>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProjects.map((proj) => (
              <div key={proj._id} onClick={() => setSelectedProject(proj)} className={`p-5 border rounded-2xl flex items-center gap-4 cursor-pointer transition-all group ${selectedProject?._id === proj._id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] transition-colors ${selectedProject?._id === proj._id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>{proj.key}</div>
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

      {/* --- MODAL OVERLAY --- */}
      {selectedProject && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setSelectedProject(null)} />
          <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="px-10 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><ChevronLeft size={24} /></button>
                {isEditingProject ? (
                  <div className="flex items-center gap-3">
                    <input className="px-4 py-2 border rounded-xl font-bold text-sm outline-none border-blue-500" value={editProjectData.name} onChange={e => setEditProjectData({...editProjectData, name: e.target.value})} />
                    <input className="px-4 py-2 border rounded-xl font-black text-xs uppercase w-24 outline-none border-blue-500" value={editProjectData.key} onChange={e => setEditProjectData({...editProjectData, key: e.target.value.toUpperCase()})} />
                    <button onClick={handleUpdateProject} className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"><Save size={18} /></button>
                    <button onClick={() => setIsEditingProject(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200"><X size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-slate-800">{selectedProject.name} <span className="text-blue-500 ml-2 font-medium">({selectedProject.key})</span></h2>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setIsEditingProject(true)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={16} /></button>
                      <button onClick={handleDeleteProject} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setModalTab("overview")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${modalTab === "overview" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Dashboard</button>
                <button onClick={() => setModalTab("tasks")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${modalTab === "tasks" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>+ Create Task</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F8F9FB] p-6 lg:p-10">
              {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${message.includes("✅") ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  {message.includes("✅") ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
                  <p className="text-sm font-bold">{message}</p>
                </div>
              )}

              {modalTab === "overview" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      {[{ l: "Total Tasks", v: taskStats.total }, { l: "Completed", v: taskStats.done }, { l: "In Progress", v: taskStats.active }, { l: "Overall", v: `${taskStats.avg}%` }].map(s => (
                        <div key={s.l} className="bg-white p-5 rounded-3xl border border-slate-100">
                          <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{s.l}</p>
                          <p className="text-xl font-black text-slate-800">{s.v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> Project Tasks</h3>
                      <div className="space-y-4">
                        {projectTasks.length > 0 ? projectTasks.map((task) => (
                          <div key={task._id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm group">
                            <div className="flex items-start justify-between gap-6 mb-4">
                              <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-2 mb-3">
                                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{task.taskId}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
                                  <div className="text-[9px] text-orange-500 font-black bg-orange-50 px-2 py-1 rounded"><Clock size={10} className="inline mr-1" /> {calculateDaysRemaining(task.dueDate)}</div>
                                </div>
                                <p className="text-sm font-bold text-slate-800 mb-3">{task.remarks}</p>
                                <div className="flex flex-wrap gap-2">
                                  {task.assigneeNames.map((name, i) => (
                                    <span key={i} className="flex items-center gap-1 bg-slate-50 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded border border-slate-100"><User size={8} /> {name}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-slate-400 uppercase">Progress</p>
                                 <span className="text-lg font-black text-slate-800">{task.completion}%</span>
                              </div>
                            </div>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-50">
                                {task.subtasks.map((sub, idx) => <SubtaskItem key={idx} sub={sub} level={0} />)}
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="p-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black uppercase tracking-widest">
                            {loading ? "Loading Tasks..." : "No tasks in this project"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                      <Settings className="text-blue-400 mb-6" size={24} />
                      <h4 className="text-xs font-black uppercase tracking-widest mb-4">Workspace Info</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs pb-3 border-b border-slate-800"><span className="text-slate-400">Framework</span><span className="font-bold">{selectedProject.projectType}</span></div>
                        <div className="flex justify-between text-xs pb-3 border-b border-slate-800"><span className="text-slate-400">Unique Key</span><span className="font-bold">{selectedProject.key}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-slate-400">Created</span><span className="font-bold">{new Date(selectedProject.createdAt).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* --- TASK CREATION FORM --- */
                <div className="max-w-5xl mx-auto pb-10">
                  <form onSubmit={handleTaskSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-8">
                        <div>
                           <div className="flex items-center gap-2 mb-4 text-slate-800"><Target size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Core Metadata</h2></div>
                           <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Issue ID Base</label><input type="text" value={taskFormData.taskId} onChange={(e) => setTaskFormData({...taskFormData, taskId: e.target.value})} className={formElementClass} placeholder="e.g. TASK-01" /></div>
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Owner Department *</label><select value={taskFormData.department} onChange={(e) => setTaskFormData({...taskFormData, department: e.target.value, assigneeNames: []})} className={formElementClass}><option value="">Select Department</option>{DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                           </div>
                        </div>
                        
                        <div className="h-px bg-slate-100" />
                        
                        <div>
                           <div className="flex items-center gap-2 mb-4 text-slate-800"><Users size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Assignees</h2></div>
                           {!taskFormData.department ? (
                             <div className="py-8 text-center text-[10px] font-black text-slate-300 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 uppercase tracking-widest">Select department to view members</div>
                           ) : (
                             <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                               {filteredAssignees.map(emp => (
                                 <label key={emp._id} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${taskFormData.assigneeNames.includes(emp.name) ? 'border-blue-500 bg-blue-50' : 'border-slate-50 hover:border-slate-100'}`}>
                                    <input type="checkbox" checked={taskFormData.assigneeNames.includes(emp.name)} onChange={(e) => {
                                      const names = e.target.checked ? [...taskFormData.assigneeNames, emp.name] : taskFormData.assigneeNames.filter(n => n !== emp.name);
                                      setTaskFormData({...taskFormData, assigneeNames: names});
                                    }} className="hidden" />
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
                           <div className="grid grid-cols-3 gap-4">
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Start</label><input type="date" value={taskFormData.startDate} onChange={(e) => setTaskFormData({...taskFormData, startDate: e.target.value})} className={formElementClass} /></div>
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Target End</label><input type="date" value={taskFormData.endDate} onChange={(e) => setTaskFormData({...taskFormData, endDate: e.target.value})} className={formElementClass} /></div>
                             <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Deadline</label><input type="date" value={taskFormData.dueDate} onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})} className={formElementClass} /></div>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 text-slate-800"><BarChart3 size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Status & Completion</h2></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Current State</label><select value={taskFormData.status} onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value})} className={formElementClass}>{["Backlog", "In Progress", "Paused", "Completed", "On Hold"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Progress (%)</label><input type="number" min="0" max="100" value={taskFormData.completion} onChange={(e) => setTaskFormData({...taskFormData, completion: e.target.value})} className={formElementClass} /></div>
                      </div>
                      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-slate-800"><FileText size={18} /><h2 className="font-black text-xs uppercase tracking-widest">Task Description</h2></div>
                        <textarea rows={6} value={taskFormData.remarks} onChange={(e) => setTaskFormData({...taskFormData, remarks: e.target.value})} placeholder="Describe the task objective..." className={`${formElementClass} resize-none min-h-[120px]`} />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 tracking-[0.2em]">
                        <Plus size={16} /> {loading ? 'Saving...' : 'Create Task'}
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
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}