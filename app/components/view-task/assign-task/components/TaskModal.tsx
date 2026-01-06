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
  Pause,
  Play,
  ChevronRight,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  Task,
  Subtask,
  Employee,
  SubtaskChangeHandler,
  SubtaskPathHandler,
  SubtaskStatusChangeFunc,
} from "./types";
import TaskSubtaskEditor from "./TaskSubtaskEditor";
import SubtaskModal from "./SubtaskModal";

// --- Utilities ---

/**
 * Safely calculates days difference between today and a target date.
 * Handles null/undefined to prevent ts(2345).
 */
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
  } catch (error) {
    return null;
  }
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

// --- Sub-Components ---

const DueDateReminder: React.FC<{ dueDate?: string | null; endDate?: string | null; status?: string }> = ({ dueDate, endDate, status }) => {
  const daysToDue = calculateDaysDiff(dueDate);
  const daysToEnd = calculateDaysDiff(endDate);
  
  if (status === "Completed" || (daysToDue === null && daysToEnd === null)) return null;

  const daysRemaining = (daysToDue ?? daysToEnd) as number;
  const dateLabel = daysToDue !== null ? "Due Date" : "End Date";
  const targetDate = (dueDate ?? endDate) as string;
  
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
          {isOverdue ? `${dateLabel} overdue by ${Math.abs(daysRemaining)} days` : daysRemaining === 0 ? `${dateLabel} is today!` : `${daysRemaining} days remaining until ${dateLabel}`}
        </p>
        <p className="text-xs opacity-70 font-medium">Target Date: {new Date(targetDate).toLocaleDateString()}</p>
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
        <li key={sub.id || i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">
                {sub.id ?? "NEW"} 
              </span>
              <p className="font-bold text-slate-800">{sub.title || "Untitled Subtask"}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sub.status || "Pending"}
                onChange={(e) => {
                  // Guard against null id before passing to handler
                  if (sub.id) handleSubtaskStatusChange(sub.id, e.target.value);
                }}
                className="text-xs font-bold border-none bg-slate-100 rounded-lg px-2 py-1 outline-none focus:ring-2 ring-indigo-500"
              >
                {["Pending", "In Progress", "Completed", "Paused"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => onView(sub)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={16} /></button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1"><User size={12}/> {sub.assigneeName || 'Unassigned'}</span>
            <span className="flex items-center gap-1"><Clock size={12}/> {sub.timeSpent || 0}h</span>
            <span className="flex items-center gap-1"><BarChart3 size={12}/> {sub.storyPoints || 0}pts</span>
            <span className="flex items-center gap-1"><Calendar size={12}/> {sub.date || "N/A"}</span>
          </div>
          {sub.subtasks && sub.subtasks.length > 0 && (
            <SubtaskViewer 
              subtasks={sub.subtasks} 
              level={level + 1} 
              handleSubtaskStatusChange={handleSubtaskStatusChange} 
              onView={onView} 
            />
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-[3rem] shadow-2xl flex flex-col w-full max-w-6xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{task.project}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-800">{isEditing ? "Modify Task" : "Task Insight"}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <DueDateReminder dueDate={task.dueDate} endDate={task.endDate} status={task.status} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Effort", val: `${totalTime} hrs`, icon: <Clock className="text-blue-500"/> },
              { label: "Story Points", val: totalPoints, icon: <BarChart3 className="text-purple-500"/> },
              { label: "Completion", val: `${current.completion || 0}%`, icon: <CheckCircle2 className="text-emerald-500"/> },
              { label: "Status", val: current.status || "Backlog", icon: <AlertCircle className="text-orange-500"/> }
            ].map((s, i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl">{s.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-lg font-black text-slate-800">{s.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-4">Task Parameters</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Assignee</label>
                    {isEditing ? (
                      <select name="assigneeNames" value={current.assigneeNames?.[0] || ""} onChange={handleDraftChange} className="w-full mt-2 p-3 bg-slate-50 border-none rounded-xl font-bold outline-none ring-indigo-500 focus:ring-2">
                        <option value="">Select Assignee</option>
                        {employees.map(e => <option key={e._id} value={e.name}>{e.name}</option>)}
                      </select>
                    ) : <p className="mt-2 p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{task.assigneeNames?.join(', ') || 'N/A'}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Current Status</label>
                    <select 
                      name="status" value={current.status} 
                      onChange={isEditing ? handleDraftChange : (e) => onTaskStatusChange(task._id, e.target.value)} 
                      className="w-full mt-2 p-3 bg-slate-50 border-none rounded-xl font-bold outline-none ring-indigo-500 focus:ring-2"
                    >
                      {allTaskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Remarks / Context</label>
                    {isEditing ? (
                      <textarea name="remarks" value={current.remarks} onChange={handleDraftChange} rows={3} className="w-full mt-2 p-4 bg-slate-50 border-none rounded-xl font-bold outline-none ring-indigo-500 focus:ring-2 resize-none" />
                    ) : <p className="mt-2 p-4 bg-slate-50 rounded-xl font-bold text-slate-600 leading-relaxed">{task.remarks || 'No remarks provided.'}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <ChevronRight size={18} className="text-indigo-600" /> Component Breakdown
                </h3>
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
                    allTaskStatuses={["Pending", "In Progress", "Completed", "Paused"]}
                  />
                ) : (
                  <SubtaskViewer 
                    subtasks={task.subtasks || []} 
                    level={0} 
                    handleSubtaskStatusChange={(subId, status) => {
                      if (task._id) onSubtaskStatusChange(task._id, subId, status);
                    }} 
                    onView={setSelectedSubtask} 
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">Lifecycle Dates</h4>
                {[
                  { key: 'startDate', label: 'Start Date' },
                  { key: 'dueDate', label: 'Due Date' },
                  { key: 'endDate', label: 'End Date' }
                ].map(f => (
                  <div key={f.key} className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Calendar size={16}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{f.label}</p>
                      <p className="text-sm font-black text-slate-700">
                        {task[f.key as keyof Task] ? new Date(task[f.key as keyof Task] as string).toLocaleDateString() : 'Not Defined'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-4">Sprint Control</h4>
                {task.status === "Backlog" && !isEditing && (
                  <button onClick={() => handleStartSprint(task._id)} className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                    <Play size={16} fill="currentColor" /> Initiate Sprint
                  </button>
                )}
                <p className="mt-4 text-[10px] text-slate-500 font-bold leading-relaxed italic">
                  Note: Total effort and points are automatically calculated by summing all nested subtasks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 z-20">
          {isEditing ? (
            <>
              <button onClick={handleUpdate} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2">
                <Save size={16}/> Save Updates
              </button>
              <button onClick={cancelEdit} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase transition-all">
                Discard Changes
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleEdit(task)} className="px-8 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg transition-all flex items-center gap-2">
                <Edit2 size={16}/> Edit Mode
              </button>
              <button onClick={() => handleDelete(task._id)} className="px-8 py-3 text-red-600 hover:bg-red-50 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center gap-2">
                <Trash2 size={16}/> Delete Task
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