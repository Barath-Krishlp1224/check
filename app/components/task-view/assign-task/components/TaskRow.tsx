// ./components/TaskRow.tsx
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
} from "lucide-react";
import {
  Task,
  Subtask,
  Employee,
  SubtaskChangeHandler,
  SubtaskPathHandler,
} from "./types";
import TaskSubtaskEditor from "./TaskSubtaskEditor";

const getStatusBadge = (status: string, isSubtask: boolean = false) => {
  const baseClasses =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200";
  let colorClasses = "";
  let icon = null;

  if (status === "Completed") {
    colorClasses = isSubtask
      ? "bg-emerald-500 text-white shadow-sm"
      : "bg-emerald-50 text-emerald-700 border-2 border-emerald-200";
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
  } else if (status === "In Progress") {
    colorClasses = isSubtask
      ? "bg-blue-500 text-white shadow-sm"
      : "bg-blue-50 text-blue-700 border-2 border-blue-200";
    icon = <Clock className="w-3.5 h-3.5" />;
  } else if (
    status === "On Hold" ||
    status === "Paused" ||
    status === "Pending"
  ) {
    colorClasses = isSubtask
      ? "bg-amber-500 text-white shadow-sm"
      : "bg-amber-50 text-amber-700 border-2 border-amber-200";
    icon = <Pause className="w-3.5 h-3.5" />;
  } else {
    colorClasses = isSubtask
      ? "bg-slate-500 text-white shadow-sm"
      : "bg-slate-50 text-slate-700 border-2 border-slate-200";
    icon = <AlertCircle className="w-3.5 h-3.5" />;
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
  handleDraftChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleSubtaskChange: SubtaskChangeHandler;
  addSubtask: SubtaskPathHandler;
  removeSubtask: SubtaskPathHandler;
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
  addSubtask,
  removeSubtask,
  handleSubtaskChange,
}) => {
  const current = isEditing ? draftTask : task;
  const safeSubtasks = task.subtasks || [];
  const hasSubtasks = safeSubtasks.length > 0;

  const displayAssigneeName =
    task.assigneeNames?.length > 0
      ? task.assigneeNames.join(", ")
      : "Unassigned";
  const currentAssigneeNames = current.assigneeNames || [];

  const dummySubtaskPathHandler: SubtaskPathHandler = () => {};
  const dummyViewSubtaskHandler = () => {};

  return (
    <React.Fragment>
      <tr
        className={`transition-all duration-200 border-b border-slate-200 ${
          isEditing
            ? "bg-indigo-50 shadow-lg"
            : idx % 2 === 0
            ? "bg-white hover:bg-slate-50"
            : "bg-slate-50/50 hover:bg-slate-100"
        }`}
      >
        <td className="px-6 py-5">
          {hasSubtasks && (
            <button
              onClick={() => toggleSubtasks(task._id)}
              className="p-2 rounded-lg hover:bg-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ChevronRight
                className={`w-5 h-5 text-slate-700 transform transition-transform duration-300 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>
          )}
        </td>

        <td className="px-6 py-5">
          <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg">
            {task.projectId}
          </span>
        </td>

        <td className="px-6 py-5">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
            Task
          </span>
        </td>

        {/* TITLE COLUMN – widened */}
        <td className="px-6 py-5 min-w-[1050px]">
          {isEditing ? (
            <textarea
              name="project"
              value={current.project || ""}
              onChange={handleDraftChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 resize-none shadow-sm font-medium"
              placeholder="Enter project description..."
            />
          ) : (
            <div className="text-sm font-medium text-gray-900 leading-relaxed whitespace-normal">
              {task.project}
            </div>
          )}
        </td>

        <td className="px-6 py-5 min-w-[150px]">
          {isEditing ? (
            <select
              name="assigneeNames"
              value={currentAssigneeNames}
              onChange={handleDraftChange}
              multiple
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 h-24 shadow-sm font-medium"
            >
              <option value="">Select Assignee(s)</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee.name}>
                  {employee.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-sm font-semibold">
              {displayAssigneeName}
            </span>
          )}
        </td>

        <td className="px-6 py-5 min-w-[100px]">
          {isEditing ? (
            <input
              type="date"
              name="startDate"
              value={current.startDate || ""}
              onChange={handleDraftChange}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 shadow-sm font-medium"
            />
          ) : (
            <span className="text-sm text-gray-700 font-medium">
              {task.startDate}
            </span>
          )}
        </td>

        <td className="px-6 py-5 min-w-[100px]">
          {isEditing ? (
            <input
              type="date"
              name="endDate"
              value={current.endDate || ""}
              onChange={handleDraftChange}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 shadow-sm font-medium"
            />
          ) : (
            <span className="text-sm text-gray-700 font-medium">
              {task.endDate || (
                <span className="text-gray-400 italic">N/A</span>
              )}
            </span>
          )}
        </td>

        <td className="px-6 py-5 min-w-[100px]">
          {isEditing ? (
            <input
              type="date"
              name="dueDate"
              value={current.dueDate || ""}
              onChange={handleDraftChange}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 shadow-sm font-medium"
            />
          ) : (
            <span className="text-sm text-gray-700 font-medium">
              {task.dueDate}
            </span>
          )}
        </td>

        <td className="px-6 py-5 min-w-[120px]">
          {isEditing ? (
            <input
              type="number"
              name="completion"
              value={current.completion || 0}
              onChange={handleDraftChange}
              min={0}
              max={100}
              className="w-24 px-4 py-3 border-2 border-indigo-300 rounded-xl text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 shadow-sm font-bold"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 transition-all duration-500 rounded-full shadow-sm"
                  style={{ width: `${task.completion}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-gray-900 min-w-[3rem] bg-slate-100 px-2 py-1 rounded-md">
                {task.completion}%
              </span>
            </div>
          )}
        </td>

        <td className="px-6 py-5 min-w-[140px]">
          {isEditing ? (
            <select
              name="status"
              value={current.status || ""}
              onChange={handleDraftChange}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 shadow-sm font-semibold"
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

        {/* REMARKS COLUMN – narrowed */}
        <td className="px-6 py-5 min-w-[180px]">
          {isEditing ? (
            <textarea
              name="remarks"
              value={current.remarks || ""}
              onChange={handleDraftChange}
              rows={3}
              className="w-full px-4 py-3 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 resize-none shadow-sm"
              placeholder="Add remarks..."
            />
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-normal">
              {task.remarks || (
                <span className="text-gray-400 italic">No remarks</span>
              )}
            </div>
          )}
        </td>

        <td className="px-6 py-5 text-right min-w-[200px]">
          {isEditing ? (
            <div className="flex justify-end gap-3">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 text-slate-800 text-sm font-bold rounded-xl hover:bg-slate-300 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleEdit(task)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(task._id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>

      {isExpanded && !isEditing && hasSubtasks && (
        <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
          <td colSpan={12} className="px-10 py-8">
            <div className="ml-8 border-l-4 border-indigo-600 pl-8 bg-white rounded-r-xl shadow-lg">
              <h4 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="inline-block w-3 h-3 bg-indigo-600 rounded-full shadow-sm"></span>
                <span className="text-indigo-700">
                  Subtasks for {task.project}
                </span>
              </h4>
              <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Sub ID
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {safeSubtasks.map((subtask, i) => (
                      <tr
                        key={i}
                        className="hover:bg-indigo-50 transition-all duration-200"
                      >
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-lg">
                            {subtask.id || "N/A"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm">
                            Subtask
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {subtask.title}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-800">
                            {subtask.assigneeName || (
                              <span className="text-gray-400 italic">
                                Unassigned
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-gray-700">
                            {subtask.date || (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden max-w-[90px] shadow-inner">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-600 rounded-full transition-all duration-500 shadow-sm"
                                style={{
                                  width: `${subtask.completion}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-gray-900 bg-slate-100 px-2 py-1 rounded-md min-w-[3rem] text-center">
                              {subtask.completion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(subtask.status, true)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 font-medium">
                          {subtask.remarks || (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}

      {isEditing && (
        <tr className="bg-gradient-to-r from-indigo-50 to-slate-50 border-b-2 border-indigo-200">
          <td colSpan={12} className="px-10 py-8">
            <TaskSubtaskEditor
              subtasks={subtasks}
              employees={employees}
              currentProjectPrefix={currentProjectPrefix}
              handleSubtaskChange={handleSubtaskChange}
              addSubtask={addSubtask}
              removeSubtask={removeSubtask}
              allTaskStatuses={subtaskStatuses}
              onToggleEdit={dummySubtaskPathHandler}
              onToggleExpansion={dummySubtaskPathHandler}
              onViewSubtask={dummyViewSubtaskHandler}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default TaskRow;
