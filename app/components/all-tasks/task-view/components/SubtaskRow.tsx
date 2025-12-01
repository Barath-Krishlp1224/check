// ./components/SubtaskRow.tsx
import React from "react";
import { Subtask, Employee, SubtaskChangeHandler, SubtaskPathHandler } from "./types";
import { Eye, ChevronDown, ChevronRight, Edit, Save, Trash2, PlusCircle, Clock, CheckCircle2, Pause, AlertCircle } from "lucide-react";
const subtaskStatuses = ["Pending", "In Progress", "Completed", "Paused"];
const getStatusBadge = (status: string, isSubtask: boolean = true) => {
  const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full";
  let colorClasses = "";
  let icon = null;
  if (status === "Completed") {
    colorClasses = isSubtask ? "bg-emerald-100 text-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200";
    icon = <CheckCircle2 className="w-3 h-3" />;
  } else if (status === "In Progress") {
    colorClasses = isSubtask ? "bg-blue-100 text-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200";
    icon = <Clock className="w-3 h-3" />;
  } else if (status === "Paused" || status === "Pending") {
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
interface SubtaskRowProps {
  subtask: Subtask;
  index: number;
  level: number;
  employees: Employee[];
  subtaskStatuses: string[];
  onSubtaskChange: SubtaskChangeHandler;
  onToggleEdit: SubtaskPathHandler;
  onToggleExpansion: SubtaskPathHandler;
  onRemove: SubtaskPathHandler;
  onAddNested: SubtaskPathHandler;
  onView: (subtask: Subtask) => void;
  path: number[];
}
const SubtaskRow: React.FC<SubtaskRowProps> = ({
  subtask,
  index,
  level,
  employees,
  subtaskStatuses,
  onSubtaskChange,
  onToggleEdit,
  onToggleExpansion,
  onRemove,
  onAddNested,
  onView,
  path,
}) => {
  const isEditing = subtask.isEditing ?? false;
  const isExpanded = subtask.isExpanded ?? false;
  const hasNested = !!(subtask.subtasks && subtask.subtasks.length > 0);
  const indentStyle = { paddingLeft: `${level * 20 + 16}px` };
  const StatusSelect = (
    <select
      value={subtask.status}
      onChange={(e) => onSubtaskChange(path, "status", e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
      disabled={!isEditing}
    >
      {subtaskStatuses.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
  const AssigneeSelect = (
    <select
      value={subtask.assigneeName || ""}
      onChange={(e) => onSubtaskChange(path, "assigneeName", e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
      disabled={!isEditing}
    >
      <option value="" className="text-gray-500">
        Select Assignee
      </option>
      {employees.map((employee) => (
        <option key={employee._id} value={employee.name}>
          {employee.name}
        </option>
      ))}
    </select>
  );
  const TextInput = (field: keyof Subtask, placeholder: string) => (
    <input
      value={String(subtask[field] || "")}
      onChange={(e) => onSubtaskChange(path, field, e.target.value)}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
      placeholder={placeholder}
      disabled={!isEditing}
    />
  );
  const ProgressInput = (
    <input
      type="number"
      value={subtask.completion ?? 0}
      onChange={(e) => onSubtaskChange(path, "completion", Number(e.target.value))}
      className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
      placeholder="0-100"
      min={0}
      max={100}
      disabled={!isEditing}
    />
  );
  const DisplayText = (field: keyof Subtask) => (
    <span className="text-gray-700 block px-3 py-2">{String(subtask[field] ?? "-")}</span>
  );
  return (
    <>
      <tr className={`bg-white hover:bg-slate-50 transition-colors ${level > 0 ? "border-l-4 border-l-purple-200" : ""}`}>
        <td className="px-4 py-3 font-semibold text-purple-600 bg-slate-50" style={indentStyle}>
          <div className="flex items-center gap-2">
            {hasNested ? (
              <button onClick={() => onToggleExpansion(path)} className="text-slate-600 p-1 rounded-full hover:bg-slate-200">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 h-4" />
            )}
            {subtask.id || `New-${index + 1}`}
          </div>
        </td>
        <td className="px-4 py-3">{isEditing ? TextInput("title", "Subtask Title") : DisplayText("title")}</td>
        <td className="px-4 py-3">{isEditing ? AssigneeSelect : DisplayText("assigneeName")}</td>
        <td className="px-4 py-3">{isEditing ? StatusSelect : getStatusBadge(subtask.status)}</td>
        <td className="px-4 py-3 text-center">{isEditing ? ProgressInput : <span className="text-gray-700 block px-3 py-2">{subtask.completion ?? 0}%</span>}</td>
        <td className="px-4 py-3">{isEditing ? TextInput("remarks", "Add remarks") : DisplayText("remarks")}</td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
                onClick={() => onView(subtask)}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                title="View Subtask Details"
            >
                <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleEdit(path)}
              className={`p-2 rounded-full transition-colors ${isEditing ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-slate-100 text-indigo-600 hover:bg-slate-200"}`}
              title={isEditing ? "Save" : "Edit"}
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </button>
            <button
                onClick={() => onAddNested(path)}
                className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                title="Add Nested Subtask"
            >
                <PlusCircle className="w-4 h-4" />
            </button>
            <button onClick={() => onRemove(path)} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Remove Subtask">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded &&
        hasNested &&
        subtask.subtasks?.map((nestedSub, nestedIndex) => (
          <SubtaskRow
            key={nestedSub.id || nestedIndex}
            subtask={nestedSub}
            index={nestedIndex}
            level={level + 1}
            employees={employees}
            subtaskStatuses={subtaskStatuses}
            onSubtaskChange={onSubtaskChange}
            onToggleEdit={onToggleEdit}
            onToggleExpansion={onToggleExpansion}
            onRemove={onRemove}
            onAddNested={onAddNested}
            onView={onView}
            path={[...path, nestedIndex]}
          />
        ))}
    </>
  );
};
export default SubtaskRow;