"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { Download, Search, Calendar, ChevronDown, ChevronUp, Clock, CalendarDays } from "lucide-react";

// --- INTERFACES ---
interface Subtask {
  title: string;
  status: string;
  completion: number;
  remarks?: string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

// ✅ UPDATED Task interface to remove 'name', 'plan', and 'done'
interface Task {
  _id: string;
  // ❌ Removed 'date' (though still used in filter)
  empId: string;
  project?: string; // Made optional as per model
  // ❌ Removed 'name'
  // ❌ Removed 'plan'
  // ❌ Removed 'done'
  completion?: string; // Made optional
  status?: string;     // Made optional
  remarks?: string;
  subtasks?: Subtask[];

  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;

  // Keeping 'date' for filtering/display legacy tasks, even if model dropped it
  date?: string; 
}

// -----------------------------------------------------------

const ViewTaskPage: React.FC = () => {
  // 📌 Removed 'name' from search criteria as it was removed from the model
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">(""); 
  const [searchValue, setSearchValue] = useState(""); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [timeRange, setTimeRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const parseDate = (dateStr?: string) => new Date(dateStr || new Date()); // Handle potentially undefined date

  const isFetchEnabled = useMemo(() => {
    return searchCriteria.trim() !== "" && searchValue.trim() !== "";
  }, [searchCriteria, searchValue]);

  const getPlaceholderText = () => {
    switch (searchCriteria) {
      case 'empId':
        return 'Enter Emp ID';
      case 'project':
        return 'Enter Project Name';
      default:
        return 'Select a search field first';
    }
  };

  const filterTasksByDate = (tasks: Task[]) => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return tasks.filter((task) => {
      // Use 'startDate' for filtering if 'date' is unavailable, or skip if no date is present
      const dateToFilter = task.date || task.startDate;
      if (!dateToFilter) return timeRange === "all";

      const taskDate = parseDate(dateToFilter);

      if (selectedDate) {
        const selDate = parseDate(selectedDate);
        return isSameDay(taskDate, selDate);
      }

      switch (timeRange) {
        case "today":
          return isSameDay(taskDate, now);
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return isSameDay(taskDate, yesterday);
        case "week":
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return taskDate >= weekAgo && taskDate <= now;
        case "month":
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return taskDate >= monthAgo && taskDate <= now;
        case "year":
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return taskDate >= yearAgo && taskDate <= now;
        case "all":
        default:
          return true;
      }
    });
  };

  const handleFetch = async () => {
    if (!searchCriteria || !searchValue) {
      setMessage("Please select a criteria and enter a search value.");
      setTasks([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append(searchCriteria, searchValue);

      // ⚠️ Note: If you were searching by 'name' previously, you might need a new API endpoint.
      // Assuming existing /getByEmpId or similar now handles all search criteria via query params.
      const res = await fetch(`/api/tasks/getByEmpId?${params.toString()}`); 
      const data = await res.json();

      if (res.ok) {
        const tasksArray = Array.isArray(data.tasks) ? data.tasks : [];
        const filtered = filterTasksByDate(tasksArray);
        setTasks(filtered);
        setMessage(filtered.length === 0 ? "No tasks found for selected criteria and range" : "");
      } else {
        setTasks([]);
        setMessage(data.error || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error(error);
      setTasks([]);
      setMessage("Server error");
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpanded(expanded === taskId ? null : taskId);
  };

  const downloadTasks = (tasksToDownload: Task[], filename: string) => {
    if (tasksToDownload.length === 0) {
      alert("No tasks available to download");
      return;
    }

    const worksheetData = tasksToDownload.flatMap((t) => {
      const taskRow = {
        Type: "Task",
        // Keeping 'Date' for legacy/filtering purposes
        Date: t.date ? t.date.split("T")[0] : "",
        "Employee ID": t.empId,
        Project: t.project || "",
        // ❌ Removed 'Name' column (it was t.name)
        // ❌ Removed 'Plan' column (it was t.plan)
        // ❌ Removed 'Done' column (it was t.done)
        "Completion %": t.completion || "0",
        Status: t.status || "N/A",
        Remarks: t.remarks || "",
        "Start Date": t.startDate ? t.startDate.split("T")[0] : "",
        "Due Date": t.dueDate ? t.dueDate.split("T")[0] : "",
        "End Date": t.endDate ? t.endDate.split("T")[0] : "",
        "Time Spent": t.timeSpent || "",
      };

      const subtaskRows = (t.subtasks || []).map((st) => ({
        Type: "Subtask",
        Date: t.date ? t.date.split("T")[0] : "",
        "Employee ID": t.empId,
        Project: t.project || "",
        "Subtask Name": st.title, // Use 'Subtask Name' for subtask title
        // ❌ Removed 'Plan'
        // ❌ Removed 'Done'
        "Completion %": st.completion,
        Status: st.status,
        Remarks: st.remarks || "",
        "Start Date": st.startDate ? st.startDate.split("T")[0] : "",
        "Due Date": st.dueDate ? st.dueDate.split("T")[0] : "",
        "End Date": st.endDate ? st.endDate.split("T")[0] : "",
        "Time Spent": st.timeSpent || "",
      }));

      return [taskRow, ...subtaskRows];
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, filename);
  };

  const downloadAllTasks = async () => {
    try {
      const res = await fetch("/api/tasks/all");
      const data = await res.json();

      if (!res.ok || !data.tasks || data.tasks.length === 0) {
        return alert("No tasks found");
      }

      const filtered = filterTasksByDate(data.tasks);
      downloadTasks(filtered, "All_Employee_Tasks.xlsx");
    } catch (error) {
      console.error(error);
      alert("Failed to download all tasks");
    }
  };
  
  const formatDate = (dateString?: string) => 
    dateString ? dateString.split("T")[0] : "-";

  return (
    <div className="min-h-screen"> 
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20 md:pt-24">
        {/* Header */}
        <div className="mt-[10%]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold text-white mb-5">
            Employee Tasks Dashboard
          </h1>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black">
              Filters & Search
            </h2>
          </div>

          <div className={`space-y-4`}> 
            {/* Search Criteria and Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                  <Search className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Search By
                </label>
                <select
                  value={searchCriteria}
                  onChange={(e) => {
                    setSearchCriteria(e.target.value as "empId" | "project" | "");
                    setSearchValue("");
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-black text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                >
                  <option value="" disabled>Select Field</option>
                  <option value="empId">Employee ID</option>
                  <option value="project">Project Name</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                  Search Value
                </label>
                <input
                  type="text"
                  placeholder={getPlaceholderText()}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  disabled={searchCriteria === ""}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-black text-sm sm:text-base placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Time Range and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                  <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-black text-sm sm:text-base bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 1 Month</option>
                  <option value="year">Last 1 Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
                  <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-black text-sm sm:text-base bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 pt-2">
              <button
                onClick={handleFetch}
                disabled={!isFetchEnabled}
                className={`w-full font-bold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all transform hover:scale-105 text-sm sm:text-base shadow-lg ${
                  isFetchEnabled
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Search className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Fetch Tasks
              </button>

              <button
                onClick={() => downloadTasks(tasks, `${searchCriteria ? `${searchCriteria}_${searchValue}` : "Filtered"}_Tasks.xlsx`)}
                className="w-full bg-blue-600 text-white font-bold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <Download className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Download Filtered
              </button>

              <button
                onClick={downloadAllTasks}
                className="w-full xs:col-span-2 lg:col-span-1 bg-green-600 text-white font-bold px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <Download className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Download All
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-white border border-gray-300 text-black px-4 py-3 rounded-xl mb-6 font-semibold shadow-lg text-sm sm:text-base">
            {message}
          </div>
        )}

        {/* Table Section - Desktop */}
        {tasks.length > 0 && (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Type</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Date</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Employee ID</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Project</th>
                      {/* ❌ Removed 'Name' */}
                      {/* ❌ Removed 'Plan' */}
                      {/* ❌ Removed 'Done' */}
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">%</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Status</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black">Remarks</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Start</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>Due</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><CalendarDays className="inline w-3 h-3 mr-1"/>End</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-left text-xs xl:text-sm font-bold text-black" style={{minWidth: '100px'}}><Clock className="inline w-3 h-3 mr-1"/>Time</th>
                      <th className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">Subtasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, idx) => (
                      <React.Fragment key={task._id}>
                        <tr className={`border-b border-gray-200 hover:bg-gray-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-gray-100"}`}>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-bold text-black">Task</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm font-semibold text-black">{task.empId}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.project || "-"}</td>
                          {/* ❌ Removed 'Name' cell (was task.name) */}
                          {/* ❌ Removed 'Plan' cell (was task.plan) */}
                          {/* ❌ Removed 'Done' cell (was task.done) */}
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-center text-xs xl:text-sm font-bold text-black">{task.completion || "0"}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm">
                            <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-bold ${task.status === "Completed" ? "bg-green-200 text-green-800" : task.status === "In Progress" ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"}`}>
                              {task.status || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.remarks || "-"}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.startDate)}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.dueDate)}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{formatDate(task.endDate)}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-xs xl:text-sm text-black">{task.timeSpent || "-"}</td>
                          <td className="px-4 xl:px-6 py-3 xl:py-4 text-center">
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <button onClick={() => toggleExpand(task._id)} className="text-black hover:text-gray-700 transition-colors">
                                {expanded === task._id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            ) : "-"}
                          </td>
                        </tr>

                        {expanded === task._id && task.subtasks && task.subtasks.map((subtask, subIdx) => (
                          <tr key={`${task._id}-sub-${subIdx}`} className="bg-gray-100 border-b border-gray-200">
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm font-bold text-gray-700 pl-8 xl:pl-12">Subtask</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(task.date)}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.empId}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{task.project || "-"}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black font-semibold" colSpan={3}>{subtask.title}</td> 
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-center text-xs xl:text-sm font-bold text-black">{subtask.completion}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm">
                              <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-bold ${subtask.status === "Completed" ? "bg-green-200 text-green-800" : subtask.status === "In Progress" ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"}`}>
                                {subtask.status}
                              </span>
                            </td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{subtask.remarks || "-"}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.startDate)}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.dueDate)}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{formatDate(subtask.endDate)}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3 text-xs xl:text-sm text-black">{subtask.timeSpent || "-"}</td>
                            <td className="px-4 xl:px-6 py-2 xl:py-3"></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {tasks.map((task, idx) => (
                <div key={task._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 sm:px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-2">TASK</span>
                        {/* ⚠️ Name is removed. Displaying project name as the primary title */}
                        <h3 className="font-bold text-black text-sm sm:text-base">Project: {task.project || "N/A"}</h3>
                        <p className="text-xs sm:text-sm text-gray-700 mt-1">Emp ID: {task.empId}</p>
                      </div>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${task.status === "Completed" ? "bg-green-200 text-green-800" : task.status === "In Progress" ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"}`}>
                        {task.status || "N/A"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-black">
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="font-semibold text-gray-800">Date:</span> {formatDate(task.date)}</div>
                      {/* ❌ Removed Plan and Done rows */}
                      <div><span className="font-semibold text-gray-800">Completion:</span> <span className="font-bold text-black">{task.completion || "0"}%</span></div>
                      <div><span className="font-semibold text-gray-800">Time Spent:</span> {task.timeSpent || "-"}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-green-600" />
                        <span className="font-semibold text-gray-800">Start:</span> {formatDate(task.startDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-yellow-600" />
                        <span className="font-semibold text-gray-800">Due:</span> {formatDate(task.dueDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-red-600" />
                        <span className="font-semibold text-gray-800">End:</span> {formatDate(task.endDate)}
                      </div>
                    </div>
                    
                    {task.remarks && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-800">Remarks:</span>
                        <p className="text-black mt-1">{task.remarks}</p>
                      </div>
                    )}
                  </div>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => toggleExpand(task._id)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 hover:bg-gray-100 transition-all flex items-center justify-between font-semibold text-black text-xs sm:text-sm"
                      >
                        <span>Subtasks ({task.subtasks.length})</span>
                        {expanded === task._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {expanded === task._id && (
                        <div className="bg-white p-3 sm:p-4 space-y-3">
                          {task.subtasks.map((subtask, subIdx) => (
                            <div key={`${task._id}-sub-${subIdx}`} className="bg-gray-50 rounded-lg p-3 shadow-md border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-black text-xs sm:text-sm">{subtask.title}</h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${subtask.status === "Completed" ? "bg-green-200 text-green-800" : subtask.status === "In Progress" ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"}`}>
                                  {subtask.status}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-black">
                                <div><span className="font-semibold text-gray-800">Completion:</span> <span className="font-bold text-black">{subtask.completion}%</span></div>
                                <div><span className="font-semibold text-gray-800">Time:</span> {subtask.timeSpent || "-"}</div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-xs text-black">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-green-600" />
                                  <span className="font-semibold">Start:</span> {formatDate(subtask.startDate)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-yellow-600" />
                                  <span className="font-semibold">Due:</span> {formatDate(subtask.dueDate)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-red-600" />
                                  <span className="font-semibold">End:</span> {formatDate(subtask.endDate)}
                                </div>
                              </div>
                              
                              {subtask.remarks && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-black">
                                  <span className="font-semibold text-gray-800">Remarks:</span>
                                  <p className="text-black mt-1">{subtask.remarks}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewTaskPage;