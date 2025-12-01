import React from "react";
import {
  ChevronRight,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
  User,
} from "lucide-react";
import TaskSubtaskEditor from "./TaskSubtaskEditor";
import type { RecursiveSubtaskChangeHandler, RecursiveSubtaskPathHandler, Task, Subtask, Employee } from "./types";

/**
 * This file expects the same `types` as TaskTable.tsx (imported from ./types).
 *
 * If you have a real TaskSubtaskEditor component, remove the `as any` cast in the usage.
 * I cast to any because I don't have its exact prop types in this reply.
 */

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

const mainTaskEditStatuses = [
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

const subtaskStatuses = ["Pending", "In Progress", "Completed", "Paused"];

interface TaskRowProps {
  task: Task;
  idx: number;
  isEditing: boolean;
  isExpanded: boolean;
  draftTask: Partial<Task>;
  subtasks: Subtask[];
  employees: Employee[];
  currentProjectPrefix: string;
  toggleSubtasks: (taskId: string) => void;
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  handleDraftChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;

  // recursive path-based handlers
  handleSubtaskChange: RecursiveSubtaskChangeHandler;
  addSubtask: RecursiveSubtaskPathHandler;
  removeSubtask: RecursiveSubtaskPathHandler;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  idx,
  isEditing,
  isExpanded,
  draftTask,
  subtasks,
  employees,
  currentProjectPrefix,
  toggleSubtasks,
  handleEdit,
  handleDelete,
  handleUpdate,
  cancelEdit,
  handleDraftChange,
  handleSubtaskChange,
  addSubtask,
  removeSubtask,
}) => {
  const current = isEditing ? draftTask : task;
  const hasSubtasks = !!task.subtasks && task.subtasks.length > 0;

  // Display names
  const assignees = task.assigneeNames || [];
  const assigneeDisplay = assignees.length > 0 ? assignees.join(", ") : "Unassigned";
  const draftAssignees = (current as any).assigneeNames?.join(", ") || "Select Assignees in Modal";

  return (
    <React.Fragment>
      <tr className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-indigo-50`}>
        <td className="px-4 py-4">
          {hasSubtasks && (
            <button
              onClick={() => toggleSubtasks(task._id)}
              className="p-1 rounded-lg hover:bg-indigo-100 transition-all duration-200"
            >
              <ChevronRight
                className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-indigo-600">{task.projectId}</td>
        <td className="px-4 py-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Task</span>
        </td>
        <td className="px-4 py-4 text-sm font-medium text-gray-900">
          {isEditing ? (
            <input
              name="project"
              value={(current as any).project || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            task.project
          )}
        </td>

        <td className="px-4 py-4 text-sm text-gray-900 max-w-[150px]">
          {isEditing ? (
            <span className="text-gray-500 text-xs italic bg-slate-100 p-2 rounded block">{draftAssignees}</span>
          ) : (
            <div className="font-medium max-h-12 overflow-y-auto custom-scrollbar flex items-center gap-1">
              <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {assigneeDisplay}
            </div>
          )}
        </td>

        <td className="px-4 py-4 text-sm text-gray-900">
          {isEditing ? (
            <input
              type="date"
              name="startDate"
              value={(current as any).startDate || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            task.startDate
          )}
        </td>

        <td className="px-4 py-4 text-sm text-gray-900">
          {isEditing ? (
            <input
              type="date"
              name="endDate"
              value={(current as any).endDate || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            task.endDate || <span className="text-gray-500">N/A</span>
          )}
        </td>

        <td className="px-4 py-4 text-sm text-gray-900">
          {isEditing ? (
            <input
              type="date"
              name="dueDate"
              value={(current as any).dueDate || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            task.dueDate
          )}
        </td>

        <td className="px-4 py-4">
          {isEditing ? (
            <input
              type="number"
              name="completion"
              value={(current as any).completion ?? 0}
              onChange={handleDraftChange}
              min={0}
              max={100}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${task.completion}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900 min-w-[3rem]">{task.completion}%</span>
            </div>
          )}
        </td>

        <td className="px-4 py-4">
          {isEditing ? (
            <select
              name="status"
              value={(current as any).status || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            >
              {mainTaskEditStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          ) : (
            getStatusBadge(task.status)
          )}
        </td>

        <td className="px-4 py-4 text-sm text-black max-w-[200px] whitespace-normal">
          {isEditing ? (
            <input
              name="remarks"
              value={(current as any).remarks || ""}
              onChange={handleDraftChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
            />
          ) : (
            <div className="max-h-12 overflow-y-auto text-gray-700 p-1 -m-1 custom-scrollbar">{task.remarks || "-"}</div>
          )}
        </td>

        <td className="px-4 py-4 text-right">
          {isEditing ? (
            <div className="flex justify-end gap-2">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleEdit(task)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(task._id)}
                className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* SUBTASK VIEWER */}
      {isExpanded && !isEditing && hasSubtasks && (
        <tr className="bg-slate-50">
          <td colSpan={12} className="px-8 py-6">
            <div className="ml-6 border-l-4 border-indigo-500 pl-6">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full" />
                Subtasks for {task.project}
              </h4>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Sub ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Assignee</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Progress</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {task.subtasks!.map((subtask, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-purple-600">{subtask.id || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            Subtask
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{subtask.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{subtask.assigneeName || <span className="text-gray-500">Unassigned</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden max-w-[80px]">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600" style={{ width: `${subtask.completion}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-900">{subtask.completion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(subtask.status, true)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{subtask.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* SUBTASK EDITOR (Embedded) */}
      {isEditing && (
        <tr className="bg-slate-50">
          <td colSpan={12} className="px-8 py-6">
            {/* NOTE: I cast TaskSubtaskEditor to any to avoid TS errors if its props don't match exactly.
                Replace `as any` with the correct prop type when you have the editor's types. */}
            <TaskSubtaskEditor
              {...({
                subtasks,
                employees,
                currentProjectPrefix,
                // pass path-based handlers directly (editor expects path[] signatures)
                handleSubtaskChange: handleSubtaskChange,
                addSubtask: addSubtask,
                removeSubtask: removeSubtask,
                onToggleEdit: null,
                onToggleExpansion: null,
                onViewSubtask: null,
                allTaskStatuses: subtaskStatuses,
              } as any)}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default TaskRow;
