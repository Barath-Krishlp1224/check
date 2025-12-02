import React from "react";
import { X, Clock, CheckCircle2, Pause, AlertCircle } from "lucide-react";
import { Subtask } from "./types";
const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-full";
  let colorClasses = "";
  let icon = null;
  if (status === "Completed") {
    colorClasses = "bg-emerald-100 text-emerald-800";
    icon = <CheckCircle2 className="w-4 h-4" />;
  } else if (status === "In Progress") {
    colorClasses = "bg-blue-100 text-blue-800";
    icon = <Clock className="w-4 h-4" />;
  } else if (status === "Paused" || status === "Pending") {
    colorClasses = "bg-amber-100 text-amber-800";
    icon = <Pause className="w-4 h-4" />;
  } else {
    colorClasses = "bg-gray-100 text-gray-800";
    icon = <AlertCircle className="w-4 h-4" />;
  }
  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {icon}
      {status}
    </span>
  );
};
interface SubtaskModalProps {
  subtask: Subtask | null;
  isOpen: boolean;
  onClose: () => void;
}
const SubtaskModal: React.FC<SubtaskModalProps> = ({ subtask, isOpen, onClose }) => {
  if (!isOpen || !subtask) return null;
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-white/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-8 transform transition-all duration-300 overflow-hidden"
        onClick={stopPropagation}
      >
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
          <h2 className="text-xl font-bold text-indigo-800">
            Subtask Details: {subtask.id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white transition-colors text-indigo-600 hover:text-indigo-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <p className="text-xs font-medium text-slate-500 mb-1">Title</p>
              <p className="text-slate-800 font-semibold">{subtask.title || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Assignee</p>
              <p className="text-slate-800">{subtask.assigneeName || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Progress</p>
              <p className="text-slate-800 font-mono">{subtask.completion}%</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Time Spent</p>
              <p className="text-slate-800 font-mono">{subtask.timeSpent || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Story Points</p>
              <p className="text-slate-800 font-mono">{subtask.storyPoints || 0}</p>
            </div>
            <div className='col-span-2'>
              <p className="text-xs font-medium text-slate-500 mb-1">Status</p>
              {getStatusBadge(subtask.status)}
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium text-slate-500 mb-1">Remarks</p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 max-h-24 overflow-y-auto">
                {subtask.remarks || <span className="text-gray-500 italic">No remarks provided.</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubtaskModal;