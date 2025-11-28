import React from "react";
import { Download, AlertCircle } from "lucide-react";
import { Employee } from "./types"; 

interface TaskTableHeaderProps {
  uniqueProjects: string[];
  employees: Employee[];
  downloadFilterType: string;
  setDownloadFilterType: (type: string) => void;
  downloadFilterValue: string;
  setDownloadFilterValue: (value: string) => void;
  xlsxLoaded: boolean;
  handleExcelDownload: () => void;
}

const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({
  uniqueProjects,
  employees,
  downloadFilterType,
  setDownloadFilterType,
  downloadFilterValue,
  setDownloadFilterValue,
  xlsxLoaded,
  handleExcelDownload,
}) => {
  const isDownloadDisabled = !xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue);
  return (
    <div className="mb-8 mt-30">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black mb-2">Project Tasks</h1> 
          <div className="w-24 h-1 bg-blue-600 rounded-full"></div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          
          <select
            value={downloadFilterType}
            onChange={(e) => {
              setDownloadFilterType(e.target.value);
              setDownloadFilterValue(""); 
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-700 font-medium bg-slate-50"
          >
            <option value="all">All Tasks (Default)</option>
            <option value="status">By Status (Backlog/Sprint)</option> 
            <option value="project">By Project Name</option>
            <option value="assignee">By Assignee</option>
            <option value="date">By Single Date</option>
            <option value="month">By Month (YYYY-MM)</option>
          </select>
          
          {downloadFilterType === "status" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Status</option>
              <option value="Backlog">Backlog Files</option>
              <option value="In Progress">Sprint Files (In Progress)</option>
              <option value="Completed">Completed Files</option>
              <option value="Paused">Paused Files</option>
              <option value="On Hold">On Hold Files</option>
            </select>
          )}
          {downloadFilterType === "project" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Project</option>
              {uniqueProjects.sort().map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          )}
          {downloadFilterType === "date" && (
            <input
              type="date"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          {downloadFilterType === "month" && (
            <input
              type="month"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          {downloadFilterType === "assignee" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Employee</option>
              <option value="all">All Employees</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee.name}>{employee.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleExcelDownload}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-md ${
                isDownloadDisabled
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={isDownloadDisabled}
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTableHeader;