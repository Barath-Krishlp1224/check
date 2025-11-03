// app/team-lead/assign-task/components/TaskTable.tsx

import React from "react";
import { AlertCircle } from "lucide-react";
import { Task, Subtask, Employee } from "../page"; 
import TaskRow from "./TaskRow";

// --- PROP INTERFACES ---
interface TaskTableProps {
  tasks: Task[]; // This will receive the filtered list of tasks
  employees: Employee[];
  editRowId: string | null;
  draftTask: Partial<Task>;
  subtasks: Subtask[];
  expandedTasks: string[];
  currentProjectPrefix: string;
  toggleSubtasks: (taskId: string) => void;
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
  handleUpdate: (e: React.FormEvent) => void;
  cancelEdit: () => void;
  handleDraftChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubtaskChange: (index: number, field: keyof Subtask, value: string | number) => void;
  addSubtask: () => void;
  removeSubtask: (index: number) => void;
}

// --- COMPONENT ---
const TaskTable: React.FC<TaskTableProps> = (props) => {
  // Now correctly checks the length of the filtered list
  if (props.tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No tasks found</h3>
          <p className="text-slate-500">The current filter returned no matching tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12"></th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">ID</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Type</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Project</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Assignee</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Start</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">End</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Due</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Progress</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Status</th>
              <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Remarks</th>
              <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider w-[14%]">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-100">
            {/* Iterates over the filtered list */}
            {props.tasks.map((task, idx) => (
              <TaskRow
                key={task._id}
                task={task}
                idx={idx}
                isEditing={task._id === props.editRowId}
                isExpanded={props.expandedTasks.includes(task._id)}
                draftTask={props.draftTask}
                subtasks={props.subtasks}
                employees={props.employees}
                currentProjectPrefix={props.currentProjectPrefix}
                toggleSubtasks={props.toggleSubtasks}
                handleEdit={props.handleEdit}
                handleDelete={props.handleDelete}
                handleUpdate={props.handleUpdate}
                cancelEdit={props.cancelEdit}
                handleDraftChange={props.handleDraftChange}
                handleSubtaskChange={props.handleSubtaskChange}
                addSubtask={props.addSubtask}
                removeSubtask={props.removeSubtask}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;