// ./components/TaskModal.tsx
import React, { useCallback } from "react";
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
} from "lucide-react";

// Assuming types.ts is correct and available
import {
  Task,
  Employee,
} from "./types";

/* Small status badge helper */
const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full";
  let colorClasses = "";
  let icon: React.ReactNode = null;

  if (status === "Completed") {
    colorClasses = "bg-emerald-50 text-emerald-700 border border-emerald-200";
    icon = <CheckCircle2 className="w-3 h-3" />;
  } else if (status === "In Progress") {
    colorClasses = "bg-blue-50 text-blue-700 border border-blue-200";
    icon = <Clock className="w-3 h-3" />;
  } else if (status === "Backlog") {
    colorClasses = "bg-slate-50 text-slate-700 border border-slate-200";
    icon = <AlertCircle className="w-3 h-3" />;
  } else if (status === "On Hold" || status === "Paused" || status === "Pending") {
    colorClasses = "bg-amber-50 text-amber-700 border border-amber-200";
    icon = <Pause className="w-3 h-3" />;
  } else {
    colorClasses = "bg-gray-50 text-gray-700 border border-gray-200";
    icon = <AlertCircle className="w-3 h-3" />;
  }

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {icon}
      {status}
    </span>
  );
};

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  draftTask: Partial<Task>;
  employees: Employee[];
  currentProjectPrefix: string;
  allTaskStatuses?: string[]; 
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  handleDraftChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  
  // Remaining handlers
  onTaskStatusChange: (taskId: string, newStatus: string) => void; 
  handleStartSprint: (taskId: string) => void;
  setDraftTask: React.Dispatch<React.SetStateAction<Partial<Task>>>;

  // Removed all subtask-related props:
  // subtasks: Subtask[];
  // handleSubtaskChange: SubtaskChangeHandler;
  // addSubtask: () => void; 
  // removeSubtask: SubtaskPathHandler;
  // onToggleEdit: SubtaskPathHandler; 
  // onToggleExpansion: SubtaskPathHandler;
  // onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = (props) => {
  const {
    task,
    isOpen,
    onClose,
    isEditing,
    draftTask,
    employees,
    allTaskStatuses = [], 
    handleEdit,
    handleDelete,
    handleUpdate,
    cancelEdit,
    handleDraftChange,
    handleStartSprint,
    onTaskStatusChange,
    setDraftTask,
  } = props;

  // Safely access assigneeNames array from task or draft
  const currentAssigneeNames: string[] = isEditing
    ? ((draftTask as any).assigneeNames || [])
    : ((task as any).assigneeNames || []);

  const handleAssigneeNamesChange = (assigneeName: string, isChecked: boolean) => {
    const prevNames: string[] = (draftTask as any).assigneeNames || (task as any).assigneeNames || [];

    let newNames: string[];
    if (isChecked) {
      newNames = [...new Set([...prevNames, assigneeName])];
    } else {
      newNames = prevNames.filter((name) => name !== assigneeName);
    }

    setDraftTask((prev: Partial<Task>) => ({
      ...prev,
      assigneeNames: newNames,
    }));
  };

  const handleMainTaskStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      if (newStatus && task._id) {
        onTaskStatusChange(task._id, newStatus);
      }
    },
    [task._id, onTaskStatusChange]
  );

  if (!isOpen) return null;

  const current = isEditing ? draftTask : task;
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation;

  const renderField = (
    label: string,
    name: keyof Task,
    type: "text" | "date" | "select" | "number",
    options?: string[]
  ) => {
    // Skip subtasks (removed field)
    if (name === "subtasks" || name === "assigneeNames") return null;

    const currentTask = task as Record<string, any>;
    const currentDraft = (isEditing ? (draftTask as Record<string, any>) : currentTask) as Record<string, any>;

    const finalOptions = name === "status" ? allTaskStatuses : options;

    const displayValue = currentTask[name];
    const displayString =
      typeof displayValue === "string" || typeof displayValue === "number" || displayValue === undefined
        ? (displayValue as string | number | undefined)
        : <span className="text-gray-500">N/A</span>;

    const isSelect = type === "select" || (name === "status" && !isEditing);

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>

        {isEditing || isSelect ? (
          name === "status" && !isEditing ? (
            <select
              name={String(name)}
              value={task.status || ""}
              onChange={handleMainTaskStatusChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black bg-white"
            >
              {(finalOptions ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : name === "status" && isEditing ? (
            <select
              name="status"
              value={(currentDraft as Record<string, any>).status || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black bg-white"
            >
              {(finalOptions ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type === "date" ? "date" : type === "number" ? "number" : "text"}
              name={String(name)}
              value={(currentDraft[name] as string | number | undefined) ?? ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-black"
              min={type === "number" ? 0 : undefined}
              max={type === "number" ? 100 : undefined}
            />
          )
        ) : (
          <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-gray-900 font-medium">
            {displayString ?? <span className="text-gray-500">N/A</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4xl shadow-2xl w-full max-w-3xl my-12 transform transition-all duration-300 overflow-hidden"
        onClick={stopPropagation as unknown as React.MouseEventHandler<HTMLDivElement>}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? `Edit Task: ${task.projectId}` : `Task Details: ${task.projectId}`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-8 pb-6">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">Task Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField("Task Name", "project", "text")}

              {/* Multi-Assignee Checkbox List */}
              <div className="mb-4 col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignee(s)</label>
                {isEditing ? (
                  <div className="p-2 border border-slate-300 rounded-lg bg-white overflow-y-auto max-h-[150px] shadow-sm">
                    {employees.map((employee) => {
                      const empName = employee.name;
                      const isChecked = currentAssigneeNames.includes(empName);
                      return (
                        <div key={employee._id} className="flex items-center mb-1 last:mb-0">
                          <input
                            type="checkbox"
                            id={`task-assignee-${employee._id}`}
                            checked={isChecked}
                            onChange={(e) => handleAssigneeNamesChange(empName, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <label htmlFor={`task-assignee-${employee._id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                            {empName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-gray-900 font-medium">
                    {currentAssigneeNames.join(", ") || <span className="text-gray-500">N/A</span>}
                  </p>
                )}
              </div>

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
                    value={(current as Record<string, any>).remarks || ""}
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
          
          {/* Removed Subtasks Section */}
          {/* <h3 className="text-xl font-semibold text-indigo-700 mb-4">Subtasks</h3>
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">Subtasks functionality removed per request.</div> */}

        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
          {task.status === "Backlog" && !isEditing && (
            <button onClick={() => handleStartSprint(task._id)} className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm">
              <Play className="w-4 h-4" />
              Start Sprint
            </button>
          )}

          {isEditing ? (
            <>
              <button onClick={handleUpdate} className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button onClick={cancelEdit} className="inline-flex items-center gap-1 px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors">
                <X className="w-4 h-4" />
                Cancel Edit
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleEdit(task)} className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <Edit2 className="w-4 h-4" />
                Edit Task
              </button>
              <button onClick={() => handleDelete(task._id)} className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
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