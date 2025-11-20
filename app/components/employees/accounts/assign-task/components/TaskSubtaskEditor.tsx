import React from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Subtask, Employee } from "../page"; 

const subtaskStatuses = ["Pending", "In Progress", "Completed", "Paused"];

interface TaskSubtaskEditorProps {
  subtasks: Subtask[];
  employees: Employee[];
  currentProjectPrefix: string;
  handleSubtaskChange: (index: number, field: keyof Subtask, value: string | number) => void;
  addSubtask: () => void;
  removeSubtask: (index: number) => void;
  allTaskStatuses: string[];
}

const TaskSubtaskEditor: React.FC<TaskSubtaskEditorProps> = ({ 
  subtasks,
  employees,
  currentProjectPrefix,
  handleSubtaskChange,
  addSubtask,
  removeSubtask,
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
      <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
      Subtasks (Edit Mode)
    </h4>
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">ID</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Assignee</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Progress</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Remarks</th>
            <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {subtasks.map((sub, i) => (
            <tr key={i} className="bg-white">
              <td className="px-4 py-3 text-center font-semibold text-purple-600 bg-slate-50">
                {sub.id || "New"}
              </td>
              <td className="px-4 py-3">
                <input
                  value={sub.title}
                  onChange={(e) => handleSubtaskChange(i, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="Subtask Title"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={sub.assigneeName || ""}
                  onChange={(e) => handleSubtaskChange(i, "assigneeName", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                >
                  <option value="" className="text-gray-500">Select Assignee</option>
                  {employees.map(employee => (
                    <option key={employee._id} value={employee.name}>{employee.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={sub.status}
                  onChange={(e) => handleSubtaskChange(i, "status", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                >
                  {subtaskStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={sub.completion}
                  onChange={(e) => handleSubtaskChange(i, "completion", Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="0-100"
                  min={0}
                  max={100}
                />
              </td>
              <td className="px-4 py-3">
                <input
                  value={sub.remarks || ""}
                  onChange={(e) => handleSubtaskChange(i, "remarks", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="Add remarks"
                />
              </td>
              <td className="px-4 py-3 text-center">
                <button 
                  onClick={() => removeSubtask(i)} 
                  className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center gap-3">
      <button 
        onClick={addSubtask} 
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
          currentProjectPrefix 
            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
        disabled={!currentProjectPrefix}
      >
        <Plus className="w-4 h-4" />
        Add Subtask
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