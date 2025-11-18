import React from "react";
import { Clock, CheckCircle2, User, ChevronRight, Pause, AlertCircle } from "lucide-react";
import { Task } from "../page";
interface TaskCardProps {
  task: Task;
  onViewDetails: (task: Task) => void;
}
const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full";
  let colorClasses = "";
  let icon = null;
  if (status === "Completed") {
    colorClasses = "bg-emerald-100 text-black";
    icon = <CheckCircle2 className="w-3 h-3" />;
  } else if (status === "In Progress") {
    colorClasses = "bg-blue-100 text-black";
    icon = <Clock className="w-3 h-3" />;
  } else if (status === "Backlog") { 
    colorClasses = "bg-gray-100 text-black";
    icon = <AlertCircle className="w-3 h-3" />;
  } else if (status === "On Hold" || status === "Paused" || status === "Pending") {
    colorClasses = "bg-amber-100 text-black";
    icon = <Pause className="w-3 h-3" />;
  } else {
    colorClasses = "bg-gray-100 text-black";
    icon = <AlertCircle className="w-3 h-3" />;
  }
  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {icon}
      {status}
    </span>
  );
};
const TaskCard: React.FC<TaskCardProps> = ({ task, onViewDetails }) => {
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  return (
    <div
      onClick={() => onViewDetails(task)}
      className="bg-white rounded-xl shadow-lg border border-slate-200 p-5 cursor-pointer hover:shadow-xl hover:border-indigo-400 transition-all duration-300 transform hover:-translate-y-0.5"
    >
      <div className="flex justify-between items-start mb-3">
        {getStatusBadge(task.status)}
        <span className="text-xs font-medium text-black bg-indigo-50 px-2 py-1 rounded-lg">{task.projectId}</span>
      </div>
      <h3 className="text-lg font-bold text-black mb-1 truncate">{task.project}</h3>
      
      <div className="flex items-center text-sm text-black mb-3">
        <User className="w-4 h-4 mr-2 text-black" />
        <span className="font-medium">{task.assigneeName}</span>
      </div>
      <div className="flex justify-between items-center text-sm text-black mb-3">
        <span>Due: <span className="font-semibold text-black">{task.dueDate}</span></span>
        <span>{task.completion}% Complete</span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${task.completion}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <span className="text-xs text-black">
          {hasSubtasks ? `${task.subtasks!.length} Subtask(s)` : 'No Subtasks'}
        </span>
        <button className="inline-flex items-center text-black text-sm font-medium hover:text-black">
          View Details <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};
export default TaskCard;