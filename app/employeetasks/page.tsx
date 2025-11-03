"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { Search, Calendar, ChevronDown, ChevronUp } from "lucide-react";

// --- INTERFACES (UPDATED to match the first component) ---
interface Subtask {
  title: string;
  status: string;
  completion: number; // Added completion back from the first component's model
  remarks?: string;   // Added remarks back from the first component's model
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

interface Task {
  _id: string;
  // Kept 'date' for filtering/display legacy tasks, though it was optional in the first component
  date?: string; 
  empId: string;
  project?: string; // Made optional
  // ❌ Removed 'name'
  // ❌ Removed 'plan'
  // ❌ Removed 'done'
  completion?: string | number; // Made optional
  status?: string;     // Made optional
  remarks?: string;
  subtasks?: Subtask[];

  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
}

interface ProjectStatusData {
  project: string;
  Completed: number;
  "In Progress": number;
  Pending: number;
  [key: string]: any;
}

interface CompletionPieData {
  name: string;
  value: number;
  [key: string]: any;
}

// ------------------------------------------------------------------------

const ViewTaskPage: React.FC = () => {
  // 📌 UPDATED: Removed 'name' as a search criteria option
  const [searchCriteria, setSearchCriteria] = useState<"empId" | "project" | "">(""); 
  const [searchValue, setSearchValue] = useState(""); 
  const [tasks, setTasks] = useState<Task[]>([]);
  const [message, setMessage] = useState("");
  const [timeRange, setTimeRange] = useState("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const parseDate = (dateStr?: string) => { // Handle optional date
    if (!dateStr) return new Date(0); 
    return new Date(dateStr.split("T")[0]);
  };

  const PIE_COLORS = ["#3730a3", "#1f2937"]; 
  const SUBTASK_PIE_COLORS = ["#15803d", "#0d9488", "#6d28d9"]; 

  const isFetchEnabled = useMemo(() => {
    return searchCriteria.trim() !== "" && searchValue.trim() !== "";
  }, [searchCriteria, searchValue]);

  const filterTasksByDate = (tasks: Task[]) => {
    const now = new Date();
    const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    return tasks.filter((task) => {
      // Use 'startDate' for filtering if 'date' is unavailable
      const dateToFilter = task.date || task.startDate;
      if (!dateToFilter) return timeRange === "all"; // Assume all if no date is present

      const taskDate = parseDate(dateToFilter);

      if (selectedDate) {
        const selDate = parseDate(selectedDate);
        return isSameDay(taskDate, selDate);
      }

      switch (timeRange) {
        case "today":
          return isSameDay(taskDate, now);
        case "yesterday":
          const y = new Date(now);
          y.setDate(now.getDate() - 1);
          return isSameDay(taskDate, y);
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
        case "all": // Added 'all' case for consistency
        default:
          return true;
      }
    });
  };

  const handleFetch = async () => {
    if (!isFetchEnabled) {
      setMessage("Please select a criteria and enter a search value.");
      setTasks([]);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append(searchCriteria, searchValue);

      // Assuming this endpoint works for empId or project search
      const res = await fetch(`/api/tasks/getByEmpId?${params.toString()}`); 
      const data = await res.json();

      if (res.ok) {
        const allTasksForEmp = Array.isArray(data.tasks) ? data.tasks : [];
        const filtered = filterTasksByDate(allTasksForEmp);
        setTasks(filtered);
        setMessage(filtered.length === 0 ? `No tasks found for selected criteria and range.` : "");
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

  const getPlaceholderText = () => {
    switch (searchCriteria) {
      case 'empId':
        return 'Enter Emp ID';
      // ❌ Removed 'name' case
      case 'project':
        return 'Enter Proj Name';
      default:
        return 'Select a search field first';
    }
  };

  const projectStatusData = useMemo((): ProjectStatusData[] => {
    const map = new Map<string, { Completed: number; "In Progress": number; Pending: number }>();

    tasks.forEach((task) => {
      // Ensure task.project is present and treat it as a string
      const projectName = task.project || "Unassigned"; 
      
      if (!map.has(projectName)) {
        map.set(projectName, { Completed: 0, "In Progress": 0, Pending: 0 });
      }
      
      const counts = map.get(projectName)!;
      // Normalizing status to one of the keys
      const status = task.status || "Pending"; 
      
      if (status === "Completed") {
        counts["Completed"]++;
      } else if (status === "In Progress") {
        counts["In Progress"]++;
      } else {
        counts["Pending"]++;
      }
    });

    return Array.from(map.entries()).map(([project, counts]) => ({
      project,
      ...counts,
    }));
  }, [tasks]);

  const overallCompletionData = useMemo((): CompletionPieData[] => {
    if (tasks.length === 0) return [];
    let totalCompletion = 0;
    let valid = 0;

    tasks.forEach((t) => {
      // Safely parse completion, defaulting to 0 if not present or invalid
      const completionStr = String(t.completion || "0").replace("%", "").trim();
      const val = parseFloat(completionStr);
      
      if (!isNaN(val)) {
        totalCompletion += val;
        valid++;
      }
    });

    const avg = valid > 0 ? totalCompletion / valid : 0;
    const avgRounded = Math.round(avg);
    const remainingRounded = Math.round(100 - avg);
    
    return [
      { name: "Average Completion", value: avgRounded },
      { name: "Remaining", value: remainingRounded > 0 ? remainingRounded : 0 }, // Ensure remaining is not negative
    ];
  }, [tasks]);

  const subtasksStatusData = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;

    tasks.forEach((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((st) => {
          const status = st.status || "Pending"; // Default to Pending if status is missing
          if (status === "Completed") completed++;
          else if (status === "In Progress") inProgress++;
          else pending++;
        });
      }
    });

    return [
      { name: "Completed", value: completed },
      { name: "In Progress", value: inProgress },
      { name: "Pending", value: pending },
    ];
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const avgCompletion =
    overallCompletionData.find((d) => d.name === "Average Completion")?.value || 0;
  const totalSubtasks = subtasksStatusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen ">
      <div className="w-full">
        <div className="max-w-7xl mx-auto mt-[1%] px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pt-16 sm:pt-20 md:pt-24 lg:pt-32">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 md:mb-10 text-center lg:text-left drop-shadow-lg"> 
            Employee Task Dashboard
          </h1>

          {/* --- Filters --- */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
              {/* === Search Criteria and Input Section === */}
              <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                      <Search className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Search By
                    </label>
                    <select
                      value={searchCriteria}
                      onChange={(e) => {
                        // 📌 UPDATED: Removed 'name' as an option
                        setSearchCriteria(e.target.value as "empId" | "project" | "");
                        setSearchValue("");
                      }}
                      className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg text-gray-900 focus:ring-2 focus:ring-lime-500 transition-all bg-white"
                    >
                      <option value="" disabled>Select Field</option>
                      <option value="empId">Employee ID</option>
                      {/* ❌ Removed 'Employee Name' option */}
                      <option value="project">Project Name</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                      Search Value
                    </label>
                    <input
                      type="text"
                      placeholder={getPlaceholderText()}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      disabled={searchCriteria === ""}
                      className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white rounded-lg text-gray-900 focus:ring-2 focus:ring-lime-500 transition-all placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                </div>
              </div>

              {/* === Time Range Select === */}
              <div className="sm:col-span-1">
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                  <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg text-gray-900 focus:ring-2 focus:ring-lime-500 transition-all bg-white"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 1 Month</option>
                  <option value="year">Last 1 Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {/* === Date Input === */}
              <div className="sm:col-span-1">
                <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                  <Calendar className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg text-gray-900 focus:ring-2 focus:ring-lime-500 transition-all bg-white"
                />
              </div>

              {/* === Fetch Button === */}
           <button
                onClick={handleFetch}
                disabled={!isFetchEnabled}
                className={`w-full sm:col-span-2 lg:col-span-1 font-semibold px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base rounded-lg shadow-lg transition-all transform hover:scale-105 ${
                  isFetchEnabled
                    ? "bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Fetch Dashboard
              </button>
            </div>
          </div>

          {/* --- Message --- */}
          {message && (
            <div className="bg-yellow-100 text-gray-900 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 font-medium text-sm sm:text-base shadow-md"> 
              {message}
            </div>
          )}

          {/* --- Dashboard --- */}
          {tasks.length > 0 && (
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* --- Metrics --- */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Total Tasks
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1 sm:mt-2"> 
                    {totalTasks}
                  </p>
                </div>
                
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Completed
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1 sm:mt-2"> 
                    {completedTasks}
                  </p>
                </div>
                
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Avg Completion
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1 sm:mt-2"> 
                    {avgCompletion}%
                  </p>
                </div>
                
                <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Total Subtasks
                  </p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-1 sm:mt-2"> 
                    {totalSubtasks}
                  </p>
                </div>
              </div>

              {/* --- Charts --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-xl shadow-2xl">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">
                    Task Status by Project
                  </h2>
                  <div className="h-64 sm:h-80 md:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d4" />
                        <XAxis 
                          dataKey="project" 
                          tick={{ fill: '#1f2937', fontSize: window.innerWidth < 640 ? 10 : 12 }} 
                          angle={window.innerWidth < 640 ? -45 : 0}
                          textAnchor={window.innerWidth < 640 ? "end" : "middle"}
                          height={window.innerWidth < 640 ? 60 : 30}
                        />
                        <YAxis tick={{ fill: '#1f2937', fontSize: window.innerWidth < 640 ? 10 : 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                            borderRadius: '8px',
                            fontSize: window.innerWidth < 640 ? '12px' : '14px'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '12px' : '14px' }} />
                        <Bar dataKey="Completed" fill="#15803d" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="In Progress" fill="#0d9488" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Pending" fill="#6d28d9" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-xl shadow-2xl">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">
                    Overall Completion
                  </h2>
                  <div className="h-64 sm:h-80 md:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={overallCompletionData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 90 : 120}
                          labelLine={false}
                          label={(entry: { name?: string; value?: number }) => {
                            const name = entry.name ?? "N/A";
                            const value = entry.value ?? 0;
                            const total = overallCompletionData.reduce((sum, item) => sum + item.value, 0);
                            const percentNum = total > 0 ? (value / total) * 100 : 0;
                            return window.innerWidth < 640 ? `${percentNum.toFixed(0)}%` : `${name}: ${percentNum.toFixed(0)}%`;
                          }}
                          style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                        >
                          {overallCompletionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(v: number, name: string) => [`${v}%`, name]}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                            borderRadius: '8px',
                            fontSize: window.innerWidth < 640 ? '12px' : '14px'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '14px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* --- Subtasks Chart --- */}
              {totalSubtasks > 0 && (
                <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-xl shadow-2xl">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-gray-900">
                    Subtasks Status Distribution
                  </h2>
                  <div className="h-64 sm:h-80 md:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subtasksStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={window.innerWidth < 640 ? 60 : window.innerWidth < 1024 ? 90 : 120}
                          labelLine={false}
                          label={(entry: { name?: string; value?: number }) => {
                            const name = entry.name ?? "N/A";
                            const value = entry.value ?? 0;
                            return window.innerWidth < 640 ? `${value}` : `${name}: ${value}`;
                          }}
                          style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                        >
                          {subtasksStatusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={SUBTASK_PIE_COLORS[index % SUBTASK_PIE_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                            borderRadius: '8px',
                            fontSize: window.innerWidth < 640 ? '12px' : '14px'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '11px' : '14px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTaskPage;