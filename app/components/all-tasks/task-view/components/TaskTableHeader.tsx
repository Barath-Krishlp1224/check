// ./components/TaskTableHeader.tsx
import React from "react";
import { Download, AlertCircle } from "lucide-react";
// Import Employee type from the unified types file
import { Employee } from "./types"; 

// --- PROP INTERFACE ---
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
// --- END PROP INTERFACE ---

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
  // Logic to determine if the download button should be disabled
  const isDownloadDisabled = !xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue);
  
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between">
        {/* Title Section */}
        <div>
          <h1 className="text-4xl font-bold text-black mb-2">Project Tasks</h1> 
          <div className="w-24 h-1 bg-blue-600 rounded-full"></div>
        </div>
        
        {/* Download Controls Section */}
        <div className="flex items-center gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          
          {/* 1. Filter Type Selector */}
          <select
            value={downloadFilterType}
            onChange={(e) => {
              setDownloadFilterType(e.target.value);
              setDownloadFilterValue(""); // Clear value when type changes
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
          
          {/* 2. Dynamic Filter Value Input/Selector */}
          
          {/* Status Filter */}
          {downloadFilterType === "status" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Status</option>
              <option value="backlog">Backlog Files</option>
              <option value="in progress">Sprint Files (In Progress)</option>
              <option value="completed">Completed Files</option>
              <option value="paused">Paused Files</option>
              <option value="on hold">On Hold Files</option>
            </select>
          )}
          
          {/* Project Filter */}
          {downloadFilterType === "project" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value.toLowerCase())}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Project</option>
              {uniqueProjects.sort().map((project) => (
                <option key={project} value={project.toLowerCase()}>
                  {project}
                </option>
              ))}
            </select>
          )}
          
          {/* Date Filter */}
          {downloadFilterType === "date" && (
            <input
              type="date"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          
          {/* Month Filter */}
          {downloadFilterType === "month" && (
            <input
              type="month"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          
          {/* Assignee Filter */}
          {downloadFilterType === "assignee" && (
            <select
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Employee</option>
              <option value="all">All Employees</option>
              {employees.map(employee => (
                // Use lowercase name as the value for case-insensitive filtering
                <option key={employee._id} value={employee.name.toLowerCase()}>{employee.name}</option>
              ))}
            </select>
          )}
          
          {/* 3. Export Button */}
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