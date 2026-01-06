"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  LayoutGrid, ListTodo, BarChart2, User, X, 
  CalendarDays, FolderKanban, Plus, Activity, Search,
  GitBranch, Layers, KanbanSquare, TrendingUp, CheckCircle2, Clock
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import TaskChartView from "./components/TaskChartView";
import { getAggregatedTaskData } from "./utils/aggregation";

// --- Types & Constants ---
export type ViewType = "card" | "board" | "chart";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700"
};

const ALL_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Completed", "On Hold"];

// --- Helper Components ---

const ProgressRing: React.FC<{ percentage: number }> = ({ percentage }) => (
  <div className="relative w-12 h-12 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
        strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * percentage) / 100}
        className="text-[#3fa87d] transition-all duration-500" />
    </svg>
    <span className="absolute text-[10px] font-black">{percentage}%</span>
  </div>
);

const SubtaskNode: React.FC<{ sub: any; level: number }> = ({ sub, level }) => (
  <div className={`mt-2 ${level > 0 ? "ml-6 border-l border-slate-200 pl-4" : ""}`}>
    <div className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-slate-100">
      <div className="flex items-center gap-2">
        <GitBranch size={10} className="text-slate-400" />
        <span className="text-[10px] font-bold text-slate-700">{sub.title}</span>
      </div>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
          sub.status === 'Completed' || sub.status === 'Done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
      }`}>{sub.status}</span>
    </div>
    {sub.subtasks?.map((child: any, i: number) => <SubtaskNode key={i} sub={child} level={level + 1} />)}
  </div>
);

// --- Main Page ---

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>("card");
  const [projectSearch, setProjectSearch] = useState("");

  // Modal & Edit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<any>({});
  const [subtasks, setSubtasks] = useState<any[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      const [tRes, pRes, eRes] = await Promise.all([
        fetch("/api/tasks"), fetch("/api/projects"), fetch("/api/employees")
      ]);
      const [tData, pData, eData] = await Promise.all([tRes.json(), pRes.json(), eRes.json()]);
      setTasks(Array.isArray(tData) ? tData : (tData.tasks || []));
      setProjects(Array.isArray(pData) ? pData : []);
      setEmployees(Array.isArray(eData) ? eData : (eData.employees || []));
      setLoading(false);
    } catch (err) {
      toast.error("Failed to sync data");
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // --- Recursive Subtask Logic ---
  
  const updateSubtaskTree = (subs: any[], path: number[], updateFn: (sub: any) => any): any[] => {
    return subs.map((sub, index) => {
      if (index === path[0]) {
        if (path.length === 1) return updateFn(sub);
        return { 
          ...sub, 
          subtasks: updateSubtaskTree(sub.subtasks || [], path.slice(1), updateFn) 
        };
      }
      return sub;
    });
  };

  const addSubtask = (path: number[]) => {
    const newSub = { 
        id: `SUB-${Date.now()}`, title: "New Item", status: "Pending", completion: 0, 
        subtasks: [], storyPoints: 0, timeSpent: 0, date: new Date().toISOString().split('T')[0] 
    };
    setSubtasks(prev => {
      if (path.length === 0) return [...prev, newSub];
      return updateSubtaskTree(prev, path, (s) => ({
        ...s, subtasks: [...(s.subtasks || []), newSub]
      }));
    });
  };

  const removeSubtask = (path: number[]) => {
    setSubtasks(prev => {
      if (path.length === 1) return prev.filter((_, idx) => idx !== path[0]);
      return updateSubtaskTree(prev, path.slice(0, -1), (parent) => ({
        ...parent,
        subtasks: parent.subtasks.filter((_: any, idx: number) => idx !== path[path.length - 1])
      }));
    });
  };

  const onToggleEdit = (path: number[]) => console.log("Edit requested for path:", path);
  const onToggleExpansion = (path: number[]) => console.log("Expand requested for path:", path);

  // --- Task Handlers ---

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/tasks/${selectedTaskForModal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftTask, subtasks }),
      });
      if (res.ok) { setIsModalOpen(false); fetchAllData(); toast.success("Task updated"); }
    } catch (err) { toast.error("Update failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) { setIsModalOpen(false); fetchAllData(); toast.info("Task deleted"); }
    } catch (err) { toast.error("Delete failed"); }
  };

  const onTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAllData();
    } catch (err) { toast.error("Status update failed"); }
  };

  const onSubtaskStatusChange = (taskId: string, subtaskId: string, newStatus: string) => {
    const findAndUpdateById = (subs: any[]): any[] => {
      return subs.map(s => {
        if (s.id === subtaskId) return { ...s, status: newStatus };
        if (s.subtasks) return { ...s, subtasks: findAndUpdateById(s.subtasks) };
        return s;
      });
    };
    setSubtasks(prev => findAndUpdateById(prev));
  };

  const handleStartSprint = (taskId: string) => {
    onTaskStatusChange(taskId, "In Progress");
    toast.success("Sprint Started");
  };

  const openTaskModal = (task: any) => {
    const aggregated = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregated);
    setSubtasks(aggregated.subtasks || []);
    setIsModalOpen(true);
    setIsEditing(false);
  };

  // --- Filtering & Stats ---

  const filteredTasks = useMemo(() => {
    if (!selectedProject || viewType !== "card") return tasks;
    return tasks.filter(t => t.projectId === selectedProject._id || t.project === selectedProject.name);
  }, [tasks, selectedProject, viewType]);

  const stats = useMemo(() => {
    if (!filteredTasks.length) return { done: 0, progress: 0, overdue: 0 };
    const today = new Date().getTime();
    const completed = filteredTasks.filter(t => t.status === "Completed" || t.status === "Done").length;
    const avgProgress = Math.round(filteredTasks.reduce((acc, t) => acc + (t.completion || 0), 0) / filteredTasks.length);
    const overdue = filteredTasks.filter(t => t.dueDate && new Date(t.dueDate).getTime() < today && t.status !== "Completed").length;
    return { done: completed, progress: avgProgress, overdue };
  }, [filteredTasks]);

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-slate-400">SYNCING ECOSYSTEM...</div>;

  return (
    <div className="flex flex-col h-screen mt-20 rounded-4xl overflow-hidden">
      <ToastContainer position="bottom-right" />
      
      {/* Clean Nav: Only the Center Switcher */}
      <nav className="z-50 px-8 py-4 bg-white border-b border-slate-100 flex justify-center">
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
          {[
            { id: "card", label: "Overview", icon: LayoutGrid },
            { id: "board", label: "Board", icon: ListTodo },
            { id: "chart", label: "Analytics", icon: BarChart2 }
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => setViewType(t.id as ViewType)} 
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                viewType === t.id ? "bg-white text-[#3fa87d] shadow-sm" : "text-gray-500 hover:text-slate-700"
              }`}
            >
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {viewType === "card" && (
          <>
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
              <div className="p-6 border-b border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Project Streams</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input placeholder="Quick search..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#3fa87d]/20" onChange={(e) => setProjectSearch(e.target.value)} />
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())).map(project => (
                  <button key={project._id} onClick={() => setSelectedProject(project)} className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all border ${selectedProject?._id === project._id ? "bg-[#3fa87d]/5 border-[#3fa87d]/20" : "hover:bg-slate-50 border-transparent"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${selectedProject?._id === project._id ? "bg-[#3fa87d] text-white" : "bg-slate-100 text-slate-500"}`}>{project.key || "PJ"}</div>
                    <div className="truncate"><p className="text-xs font-bold text-slate-800 truncate">{project.name}</p><p className="text-[9px] font-black text-slate-400 uppercase">{project.projectType}</p></div>
                  </button>
                ))}
              </nav>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
              {selectedProject ? (
                <div className="h-full flex flex-col">
                  <header className="bg-white border-b border-slate-200 p-8">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">Active Stream</span>
                            <span className="text-slate-400 text-[9px] font-bold">KEY: {selectedProject.key}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedProject.name}</h2>
                      </div>
                      <div className="flex gap-6 items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                        <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Progress</p><p className="text-2xl font-black text-[#3fa87d]">{stats.progress}%</p></div>
                        <ProgressRing percentage={stats.progress} />
                      </div>
                    </div>
                  </header>

                  <section className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {filteredTasks.map((task) => (
                      <div key={task._id} onClick={() => openTaskModal(task)} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black text-[#3fa87d] bg-[#3fa87d]/10 px-2 py-0.5 rounded">{task.taskId}</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}`}>{task.priority || 'Medium'}</span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-base group-hover:text-[#3fa87d] transition-colors">{task.remarks || "No description"}</h4>
                          </div>
                          <div className="text-right">
                              <p className="text-xl font-black text-slate-900">{task.completion || 0}%</p>
                              <div className="w-28 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-[#3fa87d] transition-all duration-700" style={{ width: `${task.completion}%` }} />
                              </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                             <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                                <span className="flex items-center gap-1"><User size={12}/> {task.assigneeNames?.[0] || 'Unassigned'}</span>
                                <span className="flex items-center gap-1"><CalendarDays size={12}/> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                             </div>
                             <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">{task.status}</span>
                        </div>
                        {task.subtasks?.length > 0 && (
                          <div className="mt-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                             {task.subtasks.slice(0, 2).map((sub: any, i: number) => <SubtaskNode key={i} sub={sub} level={0} />)}
                          </div>
                        )}
                      </div>
                    ))}
                  </section>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <TrendingUp size={40} className="text-[#3fa87d] mb-4" />
                  <h2 className="text-xl font-black text-slate-400 uppercase tracking-[0.3em]">Project Explorer</h2>
                </div>
              )}
            </main>
          </>
        )}

        {viewType === "board" && <main className="flex-1 overflow-y-auto p-8"><TaskBoardView tasks={tasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} /></main>}
        {viewType === "chart" && <main className="flex-1 overflow-y-auto p-8"><TaskChartView tasks={tasks} /></main>}
      </div>

      {selectedTaskForModal && (
        <TaskModal
          task={selectedTaskForModal}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isEditing={isEditing}
          draftTask={draftTask}
          subtasks={subtasks}
          employees={employees}
          currentProjectPrefix={selectedProject?.key || "TASK"}
          allTaskStatuses={ALL_STATUSES}
          handleEdit={() => { setIsEditing(true); setDraftTask(selectedTaskForModal); }}
          handleUpdate={handleUpdate}
          handleDelete={() => handleDelete(selectedTaskForModal._id)}
          cancelEdit={() => setIsEditing(false)}
          handleDraftChange={(e: any) => setDraftTask({...draftTask, [e.target.name]: e.target.value})}
          handleSubtaskChange={setSubtasks}
          addSubtask={addSubtask}
          removeSubtask={removeSubtask}
          onToggleEdit={onToggleEdit}
          onToggleExpansion={onToggleExpansion}
          handleStartSprint={handleStartSprint}
          onTaskStatusChange={onTaskStatusChange}
          onSubtaskStatusChange={onSubtaskStatusChange}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TasksPage;