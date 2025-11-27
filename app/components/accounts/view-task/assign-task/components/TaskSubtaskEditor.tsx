import React from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Subtask, Employee, SubtaskChangeHandler, SubtaskPathHandler } from "./types";
import SubtaskRow from "./SubtaskRow";
const subtaskStatuses = ["Pending", "In Progress", "Completed", "Paused"];
interface TaskSubtaskEditorProps {
  subtasks: Subtask[];
  employees: Employee[];
  currentProjectPrefix: string;
  handleSubtaskChange: SubtaskChangeHandler;
  addSubtask: SubtaskPathHandler;
  removeSubtask: SubtaskPathHandler;
  onToggleEdit: SubtaskPathHandler;
  onToggleExpansion: SubtaskPathHandler;
  onViewSubtask: (subtask: Subtask) => void;
  allTaskStatuses: string[];
}
const TaskSubtaskEditor: React.FC<TaskSubtaskEditorProps> = ({
  subtasks,
  employees,
  currentProjectPrefix,
  handleSubtaskChange,
  addSubtask,
  removeSubtask,
  onToggleEdit,
  onToggleExpansion,
  onViewSubtask,
}) => (
  <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-6">
    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
      Subtasks Editor (Recursive)
    </h4>
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[8%]">ID</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[12%]">Title</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[10%]">Assignee</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[8%]">Date</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[7%]">Story Points</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[10%]">Working Hours</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[10%]">Status</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[8%]">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase w-[15%]">Remarks</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase w-[12%]">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subtasks.length === 0 ? (
                <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                        No subtasks added yet.
                    </td>
                </tr>
            ) : (
                subtasks.map((sub, i) => (
                    <SubtaskRow
                        key={sub.id || i}
                        subtask={sub}
                        index={i}
                        level={0}
                        employees={employees}
                        subtaskStatuses={subtaskStatuses}
                        onSubtaskChange={handleSubtaskChange}
                        onToggleEdit={onToggleEdit}
                        onToggleExpansion={onToggleExpansion}
                        onRemove={removeSubtask}
                        onAddNested={addSubtask}
                        onView={onViewSubtask}
                        path={[i]}
                    />
                ))
            )}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center gap-3">
      <button
        onClick={() => addSubtask([])}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
          currentProjectPrefix
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
        disabled={!currentProjectPrefix}
      >
        <Plus className="w-4 h-4" />
        Add Top-Level Subtask
      </button>
      {!currentProjectPrefix && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Cannot add subtask: Project ID is missing</span>
        </div>
      )}
    </div>
  </div>
);
export default TaskSubtaskEditor;