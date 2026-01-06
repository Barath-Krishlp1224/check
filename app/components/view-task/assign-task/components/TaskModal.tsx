"use client";

import React, { useCallback, useState, useMemo } from "react";
import {
  X,
  Edit2,
  Trash2,
  Save,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  BarChart3,
  Loader2,
  Play
} from "lucide-react";
import {
  Task,
  Subtask,
  Employee,
  SubtaskChangeHandler,
  SubtaskPathHandler,
} from "./types";
import TaskSubtaskEditor from "./TaskSubtaskEditor";
import SubtaskModal from "./SubtaskModal";

// --- Utilities ---
const calculateDaysDiff = (dateStr: string | undefined | null): number | null => {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) { return null; }
};

const sumAllSubtasksTime = (subtasks: Subtask[] | undefined | null): number => {
  if (!subtasks || subtasks.length === 0) return 0;
  return subtasks.reduce((total, sub) => {
    const raw = sub.timeSpent;
    const current = typeof raw === "number" ? raw : parseFloat(raw as string) || 0;
    const nested = sub.subtasks ? sumAllSubtasksTime(sub.subtasks) : 0;
    return total + current + nested;
  }, 0);
};

const sumAllSubtasksStoryPoints = (subtasks: Subtask[] | undefined | null): number => {
  if (!subtasks || subtasks.length === 0) return 0;
  return subtasks.reduce((total, sub) => {
    const raw = sub.storyPoints;
    const current = typeof raw === "number" ? raw : parseFloat(raw as string) || 0;
    const nested = sub.subtasks ? sumAllSubtasksStoryPoints(sub.subtasks) : 0;
    return total + current + nested;
  }, 0);
};

// --- Status Color Logic (Backgrounds only, Text is Black) ---
const getStatusBgColor = (status: string = "") => {
  switch (status) {
    case "Completed":
      return "bg-emerald-200 border-emerald-300";
    case "In Progress":
      return "bg-blue-200 border-blue-300";
    case "To Do":
      return "bg-slate-200 border-slate-300";
    case "Paused":
      return "bg-amber-200 border-amber-300";
    case "Backlog":
      return "bg-purple-200 border-purple-300";
    default:
      return "bg-slate-100 border-slate-200";
  }
};

// --- Sub-Components ---
const DueDateReminder: React.FC<{ dueDate?: string | null; endDate?: string | null; status?: string }> = ({ dueDate, endDate, status }) => {
  const daysToDue = calculateDaysDiff(dueDate);
  const daysToEnd = calculateDaysDiff(endDate);
  if (status === "Completed" || (daysToDue === null && daysToEnd === null)) return null;
  const daysRemaining = (daysToDue ?? daysToEnd) as number;
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining <= 2;

  return (
    <div className={`border-2 rounded-2xl p-5 mb-6 flex items-center gap-4 shadow-sm transition-all duration-300 ${
      isOverdue ? 'bg-red-50 border-red-200 text-red-900' : 
      isUrgent ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
    }`}>
      <div className="bg-white p-3 rounded-xl shadow-sm">
        {isOverdue ? <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" /> : <Clock className="w-6 h-6 text-emerald-600" />}
      </div>
      <div className="flex-1">
        <p className="font-bold text-lg leading-tight">
          {isOverdue ? `Target overdue by ${Math.abs(daysRemaining)} days` : daysRemaining === 0 ? `Target is today!` : `${daysRemaining} days remaining`}
        </p>
      </div>
    </div>
  );
};

const SubtaskViewer: React.FC<{
  subtasks: Subtask[];
  level: number;
  handleSubtaskStatusChange: (subId: string, status: string) => void;
  onView: (subtask: Subtask) => void;
}> = ({ subtasks, level, handleSubtaskStatusChange, onView }) => {
  if (!subtasks || subtasks.length === 0) return null;
  return (
    <ul className={`space-y-3 ${level > 0 ? "mt-3 border-l-2 border-slate-200 ml-4 pl-4" : ""}`}>
      {subtasks.map((sub, i) => (
        <li key={sub.id || i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">{sub.id ?? "SUB"}</span>
              <p className="font-bold text-black">{sub.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sub.status || "To Do"}
                onChange={(e) => sub.id && handleSubtaskStatusChange(sub.id, e.target.value)}
                className={`text-xs font-black border rounded-lg px-2 py-1 outline-none cursor-pointer text-black ${getStatusBgColor(sub.status)}`}
              >
                {["To Do", "In Progress", "Completed", "Paused"].map(s => <option key={s} value={s} className="bg-white text-black">{s}</option>)}
              </select>
              <button onClick={() => onView(sub)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"><Eye size={16} /></button>
            </div>
          </div>
          {sub.subtasks && sub.subtasks.length > 0 && (
            <SubtaskViewer subtasks={sub.subtasks} level={level + 1} handleSubtaskStatusChange={handleSubtaskStatusChange} onView={onView} />
          )}
        </li>
      ))}
    </ul>
  );
};

// --- Main Modal Component ---
interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  draftTask: Partial<Task>;
  subtasks: Subtask[];
  employees: Employee[];
  currentProjectPrefix: string;
  allTaskStatuses: string[];
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  handleDraftChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubtaskChange: SubtaskChangeHandler;
  addSubtask: SubtaskPathHandler;
  removeSubtask: SubtaskPathHandler;
  onToggleEdit: SubtaskPathHandler;
  onToggleExpansion: SubtaskPathHandler;
  handleStartSprint: (taskId: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: string) => void;
  isLoading?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = (props) => {
  const {
    task, isOpen, onClose, isEditing, draftTask, subtasks, employees,
    currentProjectPrefix, allTaskStatuses, handleEdit, handleDelete,
    handleUpdate, cancelEdit, handleDraftChange, handleSubtaskChange,
    addSubtask, removeSubtask, onToggleEdit, onToggleExpansion,
    handleStartSprint, onTaskStatusChange, onSubtaskStatusChange, isLoading = false,
  } = props;

  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const subtasksToDisplay = isEditing ? subtasks : (task.subtasks || []);
  const totalTime = useMemo(() => sumAllSubtasksTime(subtasksToDisplay), [subtasksToDisplay]);
  const totalPoints = useMemo(() => sumAllSubtasksStoryPoints(subtasksToDisplay), [subtasksToDisplay]);
  const current = isEditing ? draftTask : task;

  if (!isOpen) return null;
  if (isLoading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-[3rem] shadow-2xl flex flex-col w-full max-w-7xl max-h-[80vh] mt-20 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header - MODIFIED FOR BOLD PROJECT NAME */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <span className="text-blue-500 text-[11px] font-[1000] uppercase tracking-[0.4em] mb-1 block">
              {task.taskId}
            </span>
            <h2 className="text-4xl font-[1000] text-slate-900 tracking-tighter uppercase">
              {task.project || "No Project Specified"}
            </h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
          <DueDateReminder dueDate={task.dueDate} endDate={task.endDate} status={task.status} />

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Logged Effort", val: `${totalTime} hrs`, icon: <Clock className="text-blue-500"/> },
              { label: "Complexity", val: `${totalPoints} SP`, icon: <BarChart3 className="text-purple-500"/> },
              { label: "Progress", val: `${current.completion || 0}%`, icon: <CheckCircle2 className="text-emerald-500"/> },
              { label: "Current State", val: current.status || "Backlog", icon: <AlertCircle className="text-orange-500"/> }
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="bg-slate-50 p-4 rounded-2xl">{s.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-xl font-black text-black">{s.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-10">
            {/* Multi-Column Specification Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-8 pb-4 border-b">Core Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
                {/* 1. Project/Task Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Task Identity</label>
                  {isEditing ? (
                    <input name="project" placeholder="Enter project name..." value={current.project || ""} onChange={handleDraftChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-blue-500 outline-none text-sm text-black placeholder:text-slate-500" />
                  ) : <p className="p-4 bg-slate-50 rounded-2xl font-bold text-black text-sm truncate">{task.project || 'N/A'}</p>}
                </div>

                {/* 2. Assignee */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Primary Lead</label>
                  {isEditing ? (
                    <select name="assigneeNames" value={current.assigneeNames?.[0] || ""} onChange={handleDraftChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-blue-500 outline-none text-sm text-black">
                      <option value="" className="text-slate-500 italic">Unassigned</option>
                      {employees.map(e => <option key={e._id} value={e.name} className="text-black">{e.name}</option>)}
                    </select>
                  ) : <p className="p-4 bg-slate-50 rounded-2xl font-bold text-black text-sm">{task.assigneeNames?.join(', ') || 'N/A'}</p>}
                </div>

                {/* 3. Status - Dynamically colored Background, Black Text */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Workflow</label>
                  <select 
                    name="status" 
                    value={current.status} 
                    onChange={isEditing ? handleDraftChange : (e) => onTaskStatusChange(task._id, e.target.value)} 
                    className={`w-full p-4 rounded-2xl font-black border focus:ring-2 ring-blue-500 outline-none text-sm text-black transition-all ${getStatusBgColor(current.status)}`}
                  >
                    {allTaskStatuses.map(s => <option key={s} value={s} className="bg-white text-black font-bold">{s}</option>)}
                  </select>
                </div>

                {/* 4. Dates */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Deadline</label>
                  {isEditing ? (
                    <input type="date" name="dueDate" value={current.dueDate || ""} onChange={handleDraftChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-blue-500 outline-none text-sm text-black" />
                  ) : <p className="p-4 bg-slate-50 rounded-2xl font-bold text-black text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>}
                </div>

                {/* 5. Progress */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Completion</label>
                  {isEditing ? (
                    <input type="number" name="completion" placeholder="0" value={current.completion || 0} onChange={handleDraftChange} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-blue-500 outline-none text-sm text-black placeholder:text-slate-500" />
                  ) : <p className="p-4 bg-slate-50 rounded-2xl font-bold text-black text-sm">{task.completion || 0}%</p>}
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Strategic Remarks</label>
                  {isEditing ? (
                    <textarea name="remarks" placeholder="Add detailed notes here..." value={current.remarks} onChange={handleDraftChange} rows={3} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none focus:ring-2 ring-blue-500 outline-none resize-none text-sm text-black placeholder:text-slate-500" />
                  ) : <p className="p-5 bg-slate-50 rounded-2xl font-bold text-black leading-relaxed text-sm">{task.remarks || 'No specific instructions provided.'}</p>}
              </div>
            </div>

            {/* Subtasks Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Work Breakdown Structure</h3>
              </div>
              {isEditing ? (
                <TaskSubtaskEditor
                  subtasks={subtasks}
                  employees={employees}
                  currentProjectPrefix={currentProjectPrefix}
                  handleSubtaskChange={handleSubtaskChange}
                  addSubtask={addSubtask}
                  removeSubtask={removeSubtask}
                  onToggleEdit={onToggleEdit}
                  onToggleExpansion={onToggleExpansion}
                  onViewSubtask={setSelectedSubtask}
                  allTaskStatuses={["To Do", "In Progress", "Completed", "Paused"]}
                />
              ) : (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                   <SubtaskViewer 
                    subtasks={task.subtasks || []} 
                    level={0} 
                    handleSubtaskStatusChange={(subId, status) => onSubtaskStatusChange(task._id, subId, status)} 
                    onView={setSelectedSubtask} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-white sticky bottom-0 z-20">
          {task.status === "Backlog" && !isEditing && (
             <button onClick={() => handleStartSprint(task._id)} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2">
                <Play size={18}/> Start Sprint
             </button>
          )}

          {isEditing ? (
            <>
              <button onClick={handleUpdate} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-2">
                <Save size={18}/> Commit Changes
              </button>
              <button onClick={cancelEdit} className="px-10 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase transition-all">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleEdit(task)} className="px-10 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase shadow-xl transition-all flex items-center gap-2">
                <Edit2 size={18}/> Modify Task
              </button>
              <button onClick={() => handleDelete(task._id)} className="px-10 py-4 text-red-500 hover:bg-red-50 rounded-[2rem] font-black text-[10px] uppercase transition-all flex items-center gap-2">
                <Trash2 size={18}/> Remove
              </button>
            </>
          )}
        </div>
      </div>

      {selectedSubtask && (
        <SubtaskModal subtask={selectedSubtask} isOpen={!!selectedSubtask} onClose={() => setSelectedSubtask(null)} />
      )}
    </div>
  );
};

export default TaskModal;