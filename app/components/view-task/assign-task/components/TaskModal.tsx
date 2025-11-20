import React, { useCallback } from "react";
import { X, Edit2, Trash2, Save, AlertCircle, Clock, CheckCircle2, Pause, Play } from "lucide-react"; 
import { Task, Subtask, Employee } from "../page";
import TaskSubtaskEditor from "./TaskSubtaskEditor"; 

// Helper function (already present, kept for completeness)
const getStatusBadge = (status: string, isSubtask: boolean = false) => {
  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full";
  let colorClasses = "";
  let icon = null;
  if (status === "Completed") {
    colorClasses = isSubtask ? "bg-emerald-100 text-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200";
    icon = <CheckCircle2 className="w-3 h-3" />;
  } else if (status === "In Progress") {
    colorClasses = isSubtask ? "bg-blue-100 text-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200";
    icon = <Clock className="w-3 h-3" />;
  } else if (status === "Backlog") { 
    colorClasses = isSubtask ? "bg-slate-100 text-slate-800" : "bg-slate-50 text-slate-700 border border-slate-200";
    icon = <AlertCircle className="w-3 h-3" />;
  } else if (status === "On Hold" || status === "Paused" || status === "Pending") {
    colorClasses = isSubtask ? "bg-amber-100 text-amber-800" : "bg-amber-50 text-amber-700 border border-amber-200";
    icon = <Pause className="w-3 h-3" />;
  } else {
    colorClasses = isSubtask ? "bg-gray-100 text-gray-800" : "bg-gray-50 text-gray-700 border border-gray-200";
    icon = <AlertCircle className="w-3 h-3" />;
  }
  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {icon}
      {status}
    </span>
  );
};

// Interface for TaskModalProps (already present, kept for completeness)
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
  handleSubtaskChange: (index: number, field: keyof Subtask, value: string | number) => void;
  addSubtask: () => void;
  removeSubtask: (index: number) => void;
  handleStartSprint: (taskId: string) => void; 
  onTaskStatusChange: (taskId: string, newStatus: string) => void;
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = (props) => {
  const {
    task, isOpen, onClose, isEditing, draftTask, subtasks, employees, currentProjectPrefix, allTaskStatuses,
    handleEdit, handleDelete, handleUpdate, cancelEdit, handleDraftChange, 
    handleSubtaskChange, addSubtask, removeSubtask, handleStartSprint, onTaskStatusChange, onSubtaskStatusChange
  } = props;
  
  const handleMainTaskStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus && task._id) {
      onTaskStatusChange(task._id, newStatus);
    }
  }, [task._id, onTaskStatusChange]);

  const handleSubtaskStatusChange = useCallback((subtaskId: string | undefined, newStatus: string) => {
    if (task._id && subtaskId) {
      onSubtaskStatusChange(task._id, subtaskId, newStatus);
    }
  }, [task._id, onSubtaskStatusChange]);

  if (!isOpen) return null;

  const current = isEditing ? draftTask : task;
  const subtasksToDisplay = isEditing ? subtasks : task.subtasks || [];
  const hasSubtasks = subtasksToDisplay.length > 0;
  
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const renderField = (label: string, name: keyof Task, type: 'text' | 'date' | 'select' | 'number', options?: string[]) => {
    if (name === 'subtasks') {
        return null; 
    }
      
    const displayValue = task[name];
    const displayString = (typeof displayValue === 'string' || typeof displayValue === 'number' || displayValue === undefined) 
        ? displayValue 
        : <span className="text-gray-500">N/A</span>;

    const isSelect = type === 'select' || (name === 'status' && !isEditing);
    const finalOptions = name === 'status' ? allTaskStatuses : options;

    return (
        <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {isEditing || isSelect ? (
            name === 'assigneeName' ? (
                <select 
                name={name} 
                value={current[name] as string | number || ""} 
                onChange={handleDraftChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black bg-white"
                >
                <option value="">Select Assignee</option>
                {employees.map(employee => (
                    <option key={employee._id} value={employee.name}>{employee.name}</option>
                ))}
                </select>
            ) : name === 'status' && !isEditing ? (
                <select 
                name={name} 
                value={task.status || ""} 
                onChange={handleMainTaskStatusChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black bg-white"
                >
                {finalOptions?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
                </select>
            ) : name === 'status' && isEditing ? (
                <select 
                    name="status" 
                    value={current.status || ""} 
                    onChange={handleDraftChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black bg-white"
                >
                    {allTaskStatuses.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input 
                    type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
                    name={name} 
                    value={current[name] as string | number || ""} 
                    onChange={handleDraftChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black"
                    min={type === 'number' ? 0 : undefined}
                    max={type === 'number' ? 100 : undefined}
                />
            )
        ) : (
            <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-gray-900 font-medium">
            {displayString || <span className="text-gray-500">N/A</span>}
            </p>
        )}
        </div>
    );
  };

  return (
    <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4 sm:p-6" // Changed 'items-start' to 'items-center' for vertical centering
        onClick={onClose}
    >
      <div 
        className="bg-white  rounded-4xl shadow-2xl w-full max-w-5xl my-12 transform transition-all duration-300 overflow-hidden" // Changed 'mt-12 mb-8' to 'my-12' for better spacing when centered
        onClick={stopPropagation}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0  bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? `Edit Task: ${task.projectId}` : `Task Details: ${task.projectId}`}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-8 border-b pb-6">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">Task Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("Task Name", "project", "text")}
              {renderField("Assignee", "assigneeName", "select")}
              {renderField("Start Date", "startDate", "date")}
              {renderField("Due Date", "dueDate", "date")}
              {renderField("End Date", "endDate", "date")}
              {renderField("Progress (%)", "completion", "number")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                {renderField("Status", "status", "select", allTaskStatuses)}
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                {isEditing ? (
                  <input 
                    name="remarks" 
                    value={current.remarks || ""} 
                    onChange={handleDraftChange} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black" 
                    placeholder="Add remarks"
                  />
                ) : (
                  <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-gray-900 max-h-24 overflow-y-auto">
                    {task.remarks || <span className="text-gray-500">-</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">Subtasks</h3>
          
          {isEditing ? (
            <TaskSubtaskEditor
              subtasks={subtasks}
              employees={employees}
              currentProjectPrefix={currentProjectPrefix}
              handleSubtaskChange={handleSubtaskChange}
              addSubtask={addSubtask}
              removeSubtask={removeSubtask}
              allTaskStatuses={["Pending", "In Progress", "Completed", "Paused"]} 
            />
          ) : (
            hasSubtasks ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Sub ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subtasksToDisplay.map((subtask, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600">{subtask.id || "N/A"}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{subtask.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{subtask.assigneeName || <span className="text-gray-500">Unassigned</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden max-w-[80px]">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                                style={{ width: `${subtask.completion}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{subtask.completion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                              value={subtask.status || "Pending"} 
                              onChange={(e) => handleSubtaskStatusChange(subtask.id, e.target.value)}
                              className="w-full px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-xs text-gray-900 bg-white"
                          >
                              <option>Pending</option>
                              <option>In Progress</option>
                              <option>Completed</option>
                              <option>Paused</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subtask.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                This task has no subtasks.
              </div>
            )
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0  bg-white z-10">
          
          {task.status === "Backlog" && !isEditing && (
            <button 
                onClick={() => handleStartSprint(task._id)} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4" />
                Start Sprint
              </button>
          )}
          {isEditing ? (
            <>
              <button 
                onClick={handleUpdate} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button 
                onClick={cancelEdit} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel Edit
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => handleEdit(task)} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Task
              </button>
              
              <button 
                onClick={() => handleDelete(task._id)} 
                className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Task
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;