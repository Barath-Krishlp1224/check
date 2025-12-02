// ./components/TaskModal.tsx
import React, { useCallback, useState } from "react";
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
} from "lucide-react";

// Assuming types.ts is correct and available
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

/* Small status badge helper */
const getStatusBadge = (status: string, isSubtask: boolean = false) => {
  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full";
  let colorClasses = "";
  let icon: React.ReactNode = null;

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

interface TaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  draftTask: Partial<Task>;
  subtasks: Subtask[];
  employees: Employee[];
  currentProjectPrefix: string;
  allTaskStatuses?: string[]; 
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  handleDraftChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubtaskChange: SubtaskChangeHandler;
  addSubtask: () => void; // Corrected type: addSubtask should not take a path
  removeSubtask: SubtaskPathHandler;
  
  // REQUIRED MISSING PROPS from the error:
  onToggleEdit: SubtaskPathHandler; 
  onToggleExpansion: SubtaskPathHandler;
  onTaskStatusChange: (taskId: string, newStatus: string) => void; // Matching TasksPage's prop
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: string) => void; // Matching TasksPage's prop

  handleStartSprint: (taskId: string) => void;
  setDraftTask: React.Dispatch<React.SetStateAction<Partial<Task>>>;
}

const SubtaskViewer: React.FC<{
  subtasks: Subtask[];
  level: number;
  handleSubtaskStatusChange: (subtaskId: string | null | undefined, newStatus: string) => void;
  onView: (subtask: Subtask) => void;
}> = ({ subtasks, level, handleSubtaskStatusChange, onView }) => {
  if (!subtasks || subtasks.length === 0) return null;
  return (
    <ul className={`list-none ${level > 0 ? "mt-3 border-l-2 border-slate-300 ml-4 pl-4" : ""}`}>
      {subtasks.map((sub, i) => (
        // Use key based on ID if available, otherwise use index
        <li key={sub.id ?? i} className="mb-2 p-3 bg-slate-50 rounded-lg transition-colors border border-slate-200">
          <div className="flex justify-between items-center text-sm">
            <div className="font-semibold text-purple-700 flex items-center gap-2">
              {/* NOTE: You might need recursive rendering logic here if subtasks can be nested */}
              {sub.subtasks && sub.subtasks.length > 0 && <span className="w-4 h-4 text-slate-500"><ChevronRight /></span>}
              {sub.id || `New Subtask ${i + 1}`} - {sub.title}
            </div>

            <div className="flex items-center gap-4">
              <select
                value={sub.status || "Pending"}
                onChange={(e) => handleSubtaskStatusChange(sub.id, e.target.value)}
                className="px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-xs text-gray-900 bg-white"
              >
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Paused</option>
              </select>

              <span className="text-gray-600 font-medium">{sub.completion}%</span>

              <button
                onClick={(e) => { e.stopPropagation(); onView(sub); }}
                className="p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                title="View Subtask"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 mt-1 ml-2">
            Assignee: {sub.assigneeName || "Unassigned"} | Remarks: {sub.remarks || "-"}
          </div>

          {sub.subtasks && sub.subtasks.length > 0 && (
            <SubtaskViewer subtasks={sub.subtasks} level={level + 1} handleSubtaskStatusChange={handleSubtaskStatusChange} onView={onView} />
          )}
        </li>
      ))}
    </ul>
  );
};

const TaskModal: React.FC<TaskModalProps> = (props) => {
  const {
    task,
    isOpen,
    onClose,
    isEditing,
    draftTask,
    subtasks,
    employees,
    currentProjectPrefix,
    allTaskStatuses = [], 
    handleEdit,
    handleDelete,
    handleUpdate,
    cancelEdit,
    handleDraftChange,
    handleSubtaskChange,
    addSubtask,
    removeSubtask,
    onToggleEdit, // Used in TaskSubtaskEditor
    onToggleExpansion, // Used in TaskSubtaskEditor
    handleStartSprint,
    onTaskStatusChange,
    onSubtaskStatusChange,
    setDraftTask,
  } = props;

  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);

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

  const handleViewSubtask = useCallback((subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setIsSubtaskModalOpen(true);
  }, []);

  const handleCloseSubtaskModal = useCallback(() => {
    setIsSubtaskModalOpen(false);
    setSelectedSubtask(null);
  }, []);

  const handleMainTaskStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      if (newStatus && task._id) {
        onTaskStatusChange(task._id, newStatus);
      }
    },
    [task._id, onTaskStatusChange]
  );

  // Adapting the signature to match the SubtaskViewer component requirement:
  const handleSubtaskStatusChange: (subtaskId: string | null | undefined, newStatus: string) => void = useCallback(
    (subtaskId, newStatus) => {
      if (task._id && subtaskId) {
        // Calls the handler provided by TasksPage.tsx
        onSubtaskStatusChange(task._id, subtaskId, newStatus);
      }
    },
    [task._id, onSubtaskStatusChange]
  );

  if (!isOpen) return null;

  const current = isEditing ? draftTask : task;
  const subtasksToDisplay = isEditing ? subtasks : task.subtasks || [];
  const hasSubtasks = !!(subtasksToDisplay && subtasksToDisplay.length > 0);
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation;

  const renderField = (
    label: string,
    name: keyof Task,
    type: "text" | "date" | "select" | "number",
    options?: string[]
  ) => {
    // Skip subtasks and multi-assignee (rendered separately)
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
      className="fixed inset-0 z-50 overflow-y-auto bg-white/90 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-4xl shadow-2xl w-full max-w-8xl mt-30 my-12 transform transition-all duration-300 overflow-hidden"
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

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-8 border-b pb-6">
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

          <h3 className="text-xl font-semibold text-indigo-700 mb-4">Subtasks</h3>

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
              onViewSubtask={handleViewSubtask}
              allTaskStatuses={allTaskStatuses ?? ["Pending", "In Progress", "Completed", "Paused"]}
            />
          ) : hasSubtasks ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              {/* Correctly pass the adapted subtask status handler */}
              <SubtaskViewer subtasks={subtasksToDisplay} level={0} handleSubtaskStatusChange={handleSubtaskStatusChange} onView={handleViewSubtask} />
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">This task has no subtasks.</div>
          )}
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

      <SubtaskModal subtask={selectedSubtask} isOpen={isSubtaskModalOpen} onClose={handleCloseSubtaskModal} />
    </div>
  );
};

export default TaskModal;