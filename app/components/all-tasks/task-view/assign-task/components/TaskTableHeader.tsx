"use client";
import React from "react";
import { Download, Filter, Calendar, Briefcase, User as UserIcon } from "lucide-react";
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
  // Logic to disable button if xlsx isn't ready or if a specific filter value is required but missing
  const isDownloadDisabled = 
    !xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue);

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            Task Tracker
          </h1>
          <p className="text-slate-800 font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" /> 
            Manage the Team Tasks...
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white rounded-3xl shadow-xl border border-slate-100 p-5">
          {/* Filter Type Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Type
            </label>
            <select
              value={downloadFilterType}
              onChange={(e) => {
                setDownloadFilterType(e.target.value);
                setDownloadFilterValue("");
              }}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-slate-700 font-bold outline-none min-w-[160px]"
            >
              <option value="all">All Records</option>
              <option value="status">Task Status</option>
              <option value="project">Project Name</option>
              <option value="assignee">Team Member</option>
              <option value="date">Specific Date</option>
              <option value="week">Weekly Review</option>
              <option value="month">Monthly View</option>
            </select>
          </div>

          {/* Conditional Input based on Filter Type */}
          {downloadFilterType !== "all" && (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
              <label className="text-[10px] uppercase font-black text-slate-400 ml-1 tracking-widest">
                Select {downloadFilterType}
              </label>
              
              {downloadFilterType === "status" && (
                <select
                  value={downloadFilterValue}
                  onChange={(e) => setDownloadFilterValue(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="">Choose Status...</option>
                  <option value="Backlog">Backlog</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Dev Review">Dev Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              )}

              {downloadFilterType === "project" && (
                <select
                  value={downloadFilterValue}
                  onChange={(e) => setDownloadFilterValue(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="">Select Project...</option>
                  {uniqueProjects.sort().map((project) => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>
              )}

              {downloadFilterType === "date" && (
                <div className="relative">
                  <input
                    type="date"
                    value={downloadFilterValue}
                    onChange={(e) => setDownloadFilterValue(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                  />
                </div>
              )}

              {downloadFilterType === "week" && (
                <input
                  type="week"
                  value={downloadFilterValue}
                  onChange={(e) => setDownloadFilterValue(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                />
              )}

              {downloadFilterType === "month" && (
                <input
                  type="month"
                  value={downloadFilterValue}
                  onChange={(e) => setDownloadFilterValue(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                />
              )}

              {downloadFilterType === "assignee" && (
                <select
                  value={downloadFilterValue}
                  onChange={(e) => setDownloadFilterValue(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="">Choose Member...</option>
                  {employees.map(employee => (
                    <option key={employee._id} value={employee.name}>{employee.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Export Button */}
          <div className="pt-5 lg:pt-5">
            <button
              onClick={handleExcelDownload}
              className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-black rounded-xl transition-all shadow-lg active:scale-95 ${
                isDownloadDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 border border-indigo-500'
              }`}
              disabled={isDownloadDisabled}
            >
              <Download className={`w-4 h-4 ${!isDownloadDisabled && 'animate-bounce'}`} />
              {xlsxLoaded ? 'Export Excel Report' : 'Loading Library...'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative Divider */}
      <div className="w-full h-px bg-slate-100 mt-8" />
    </div>
  );
};

export default TaskTableHeader;