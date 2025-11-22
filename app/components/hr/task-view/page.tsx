"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, LayoutGrid, LogOut, BarChart2, User, Eye, Download } from "lucide-react";
import { useRouter } from 'next/navigation';

import TaskTableHeader from "./components/TaskTableHeader";
import TaskModal from "./components/TaskModal";
import TaskChartView from "./components/TaskChartView";
import TaskOverallView, { TaskTableView } from "./components/TaskTableView";

export interface Subtask {
  id?: string;
  title: string;
  assigneeName?: string;
  status: string;
  completion: number;
  remarks?: string;
}

export interface Task {
  _id: string;
  projectId: string;
  project: string;
  assigneeName: string;
  startDate: string;
  endDate?: string;
  dueDate: string;
  completion: number;
  status: "Backlog" | "In Progress" | "Dev Review" | "Deployed in QA" | "Test In Progress" | "QA Sign Off" | "Deployment Stage" | "Pilot Test" | "Completed" | "Paused" | string;
  remarks?: string;
  subtasks?: Subtask[];
}

export interface Employee {
  _id: string;
  name: string;
}

export type ViewType = "table" | "chart" | "overall";

export interface EmployeeSummary {
  employeeName: string;
  totalTasks: number;
  completed: number;
  inProgress: number;
  paused: number;
  completionRate: number;
  dueDateAdherenceScore: number;
  subtaskCompletionRate: number;
}

const getStatusCount = (tasks: Task[]) => {
  const counts = {
    completed: tasks.filter(t => t.status === "Completed").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    paused: tasks.filter(t => t.status === "Paused" || t.status === "On Hold" || t.status === "Pending").length,
  };
  return counts;
};

const calculateIncentivePercentage = (overallScore: number): number => {
  if (overallScore >= 95) return 20;
  if (overallScore >= 80) return 15;
  if (overallScore >= 75) return 10;
  if (overallScore >= 70) return 8;
  if (overallScore >= 60) return 5;
  if (overallScore >= 50) return 3;
  return 0;
};

const TasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewType, setViewType] = useState<ViewType>("table");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${base}${path}`;
  };

  const fetchTasks = async () => {
    try {
      const url = getApiUrl("/api/tasks");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
      else setError(data.error || "Failed to fetch tasks.");
    } catch (err) {
      setError("Server connection error while fetching tasks.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const url = getApiUrl("/api/employees");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch (err) {
    }
  };

  useEffect(() => {
    import('xlsx').then(XLSX => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
    }).catch(err => {
    });

    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setLoading(false);
    };
    init();
  }, []);

  const uniqueProjects = useMemo(() => {
    const projectNames = tasks.map(task => task.project).filter(Boolean);
    return Array.from(new Set(projectNames));
  }, [tasks]);

  const rawFilteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    let value = downloadFilterValue.trim().toLowerCase();
    
    let primaryFilterValue = value;
    let fromDateString = '';
    let toDateString = '';

    if (value.includes("|")) {
        const parts = value.split('|');
        primaryFilterValue = parts[0];
        fromDateString = parts[1];
        toDateString = parts[2];
        value = primaryFilterValue;
    }

    if (filter === "all" && !primaryFilterValue && !fromDateString && !toDateString) {
      return tasks;
    }

    return tasks.filter(task => {
      let isPrimaryMatch = true;
      
      switch (filter) {
        case "project":
          isPrimaryMatch = primaryFilterValue === "" || task.project.toLowerCase() === primaryFilterValue;
          break;

        case "assignee":
          isPrimaryMatch = primaryFilterValue === "" || primaryFilterValue === "all" || task.assigneeName.toLowerCase() === primaryFilterValue;
          break;

        case "status":
          isPrimaryMatch = primaryFilterValue === "" || task.status.toLowerCase() === primaryFilterValue;
          break;

        case "date":
          return task.startDate === downloadFilterValue ||
             task.dueDate === downloadFilterValue ||
             (task.endDate && task.endDate === downloadFilterValue);

        case "month":
          return task.startDate.startsWith(downloadFilterValue) ||
             task.dueDate.startsWith(downloadFilterValue) ||
             (task.endDate && task.endDate.startsWith(downloadFilterValue));

        case "all":
        case "duration": 
          isPrimaryMatch = true;
          break;

        default:
          isPrimaryMatch = true;
      }
      
      if (!isPrimaryMatch) {
          return false;
      }

      if (!fromDateString && !toDateString) {
        return true;
      }

      const fromDate = fromDateString ? new Date(fromDateString) : null;
      const toDate = toDateString ? new Date(toDateString) : null;

      const taskDates = [
          task.startDate,
          task.dueDate,
          task.endDate
      ].filter(d => d).map(d => new Date(d as string));

      return taskDates.some(taskDate => {
          let isAfterFrom = true;
          let isBeforeTo = true;

          if (fromDate) {
              fromDate.setHours(0, 0, 0, 0); 
              taskDate.setHours(0, 0, 0, 0);
              isAfterFrom = taskDate >= fromDate;
          }

          if (toDate) {
              const endOfDayToDate = new Date(toDateString as string);
              endOfDayToDate.setDate(endOfDayToDate.getDate() + 1);
              endOfDayToDate.setHours(0, 0, 0, 0); 
              
              isBeforeTo = taskDate < endOfDayToDate;
          }

          return isAfterFrom && isBeforeTo;
      });
    });
  }, [tasks, downloadFilterType, downloadFilterValue]);

  const employeeSummaries = useMemo(() => {
    const summaryMap = new Map<string, Task[]>();
    rawFilteredTasks.forEach(task => {
      const name = task.assigneeName || 'Unassigned';
      if (!summaryMap.has(name)) {
        summaryMap.set(name, []);
      }
      summaryMap.get(name)!.push(task);
    });

    const summaries: EmployeeSummary[] = [];
    
    summaryMap.forEach((tasks, name) => {
        const counts = getStatusCount(tasks);
        const totalTasks = tasks.length;
        const totalCompleted = counts.completed;
        const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
        
        const adheredTasks = tasks.filter(t => 
            t.status === "Completed" && t.endDate && t.endDate <= t.dueDate
        ).length;
        const totalCompletedForAdherence = tasks.filter(t => t.status === "Completed").length;
        const dueDateAdherenceScore = totalCompletedForAdherence > 0 
            ? Math.round((adheredTasks / totalCompletedForAdherence) * 100)
            : 100;

        const allSubtasks = tasks.flatMap(t => t.subtasks || []);
        const completedSubtasks = allSubtasks.filter(st => st.completion === 100).length;
        const totalSubtasks = allSubtasks.length;
        const subtaskCompletionRate = totalSubtasks > 0 
            ? Math.round((completedSubtasks / totalSubtasks) * 100)
            : 100;

        summaries.push({
            employeeName: name,
            totalTasks,
            completed: counts.completed,
            inProgress: counts.inProgress,
            paused: counts.paused,
            completionRate,
            dueDateAdherenceScore,
            subtaskCompletionRate,
        });
    });

    return summaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [rawFilteredTasks]);

  const generateNextSubtaskId = (prefix: string, currentSubtasks: Subtask[]) => {
    const numbers = currentSubtasks.map((sub) => {
      if (sub.id && sub.id.startsWith(`${prefix}-`)) {
        const numPart = sub.id.split("-").pop();
        return parseInt(numPart!) || 0;
      }
      return 0;
    });
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, "0");
    return `${prefix}-${nextNum}`;
  };

  const openTaskModal = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsModalOpen(true);
    setIsEditing(false);
    setDraftTask({});
    setSubtasks([]);
    setCurrentProjectPrefix("");
  };

  const closeTaskModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
        setSelectedTaskForModal(null);
        cancelEdit();
    }, 300);
  };

  const handleEdit = (task: Task) => {
    setIsEditing(true);
    setDraftTask(task);
    setCurrentProjectPrefix(task.projectId);

    const subtasksWithIDs: Subtask[] = (task.subtasks || []).map((sub, index, arr) => {
      if (!sub.id || !sub.id.startsWith(task.projectId)) {
        const tempId = generateNextSubtaskId(task.projectId, arr.slice(0, index));
        return { ...sub, id: tempId };
      }
      return sub;
    });
    setSubtasks(subtasksWithIDs);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraftTask({});
    setSubtasks([]);
    setCurrentProjectPrefix("");
  };

  const handleDraftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setDraftTask((prev) => ({
      ...prev,
      [name]: name === "completion" ? Number(value) : value,
    }));
  };

  const handleSubtaskChange = (
    index: number,
    field: keyof Subtask,
    value: string | number
  ) => {
    const updated = [...subtasks];
    (updated[index] as any)[field] =
      field === "completion" ? Number(value) : value;
    setSubtasks(updated);
  };

  const addSubtask = () => {
    const newId = generateNextSubtaskId(currentProjectPrefix, subtasks);
    setSubtasks([
      ...subtasks,
      {
        id: newId,
        title: "",
        assigneeName: "",
        status: "Pending",
        completion: 0,
        remarks: "",
      },
    ]);
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const onTaskStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const url = getApiUrl(`/api/tasks/${taskId}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task._id === taskId ? { ...task, status: newStatus as Task['status'] } : task
          )
        );
        fetchTasks();

        const statusesToNotify = ["Backlog", "In Progress", "Paused", "Completed"];

        if (statusesToNotify.includes(newStatus)) {
            console.log(`Slack Notification Triggered for Task ${taskId}: Status changed to ${newStatus}`);
        }

      } else {
        alert(`❌ Failed to update task status: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("A server error occurred during status update.");
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;

    const subtasksToSave = subtasks.filter((s) => s.title.trim() !== "");
    const updatedTask = {
      ...draftTask,
      subtasks: subtasksToSave,
      projectId: currentProjectPrefix,
    };

    try {
      const url = getApiUrl(`/api/tasks/${selectedTaskForModal._id}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Task updated successfully!");
        closeTaskModal();
        fetchTasks();
      } else {
        alert(`❌ Failed to update task: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("A server error occurred during update.");
    }
  };

  const handleStartSprint = async (taskId: string) => {
    if (!window.confirm("Do you want to start the sprint for this task? Status will change to 'In Progress'.")) return;
    try {
        const url = getApiUrl(`/api/tasks/${taskId}`);
        const res = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "In Progress" }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            alert("🚀 Sprint started! Task status is now 'In Progress'.");
            closeTaskModal();
            fetchTasks();
        } else {
            alert(`❌ Failed to start sprint: ${data.error || "Unknown error"}`);
        }
    } catch (err) {
        alert("Server error during status update.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${id}`);
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Task deleted successfully!");
        closeTaskModal();
        fetchTasks();
      } else alert(data.error || "Failed to delete task.");
    } catch (err) {
      alert("Server error during deletion.");
    }
  };

  const handleExcelDownload = (employeeName: string = 'all') => {
    if (typeof window === "undefined" || !(window as any).XLSX) {
        alert("❌ XLSX library not loaded. Please ensure SheetJS is installed.");
        return;
      }

      const XLSX = (window as any).XLSX;
      const wb = XLSX.utils.book_new();
      const valuePart = downloadFilterValue.split("|")[0] || 'all';
      const safeValue = valuePart.replace(/[^a-z0-9]/gi, '_');
      
      const isEmployeeDownload = employeeName !== 'all';

      // 1. Filter tasks based on employee name if provided
      const tasksForExport: Task[] = isEmployeeDownload
        ? tasks.filter(task => task.assigneeName === employeeName)
        : rawFilteredTasks;
      
      if (tasksForExport.length === 0) {
          alert(`No tasks found for the filter: ${isEmployeeDownload ? employeeName : 'All'}.`);
          return;
      }

      // Helper to calculate Employee Summary/Score for a single employee report
      const getEmployeeScore = (name: string, summary: EmployeeSummary) => {
        const attendanceData = new Map<string, number>([
            ["john doe", 98],
            ["jane smith", 95],
            ["unassigned", 100],
        ]);
        const WEIGHTS = {
            taskCompletion: 0.50, 
            inProgressLoad: 0.10, 
            attendance: 0.10,      
            dueDateAdherence: 0.20,
            subtaskCompletion: 0.10, 
        };
        
        const lowerName = name.toLowerCase();
        const attendance = attendanceData.get(lowerName) || 85;
        const inProgressLoadScore = Math.max(0, 100 - (summary.inProgress * 5)); 

        const overallScore = Math.round(
            (summary.completionRate * WEIGHTS.taskCompletion) +
            (inProgressLoadScore * WEIGHTS.inProgressLoad) +
            (attendance * WEIGHTS.attendance) +
            (summary.dueDateAdherenceScore * WEIGHTS.dueDateAdherence) +
            (summary.subtaskCompletionRate * WEIGHTS.subtaskCompletion)
        );

        return {
            overallScore,
            incentiveHike: calculateIncentivePercentage(overallScore),
        };
      };


      // 2. Overall Performance Sheet (Created when downloading for a specific employee OR when doing an "all" download while in the overall view)
      if (isEmployeeDownload || (employeeName === 'all' && viewType === "overall")) {
        
        const summariesToExport = isEmployeeDownload
            ? employeeSummaries.filter(s => s.employeeName === employeeName)
            : employeeSummaries;
            
        const performanceDataForExport = summariesToExport.map(summary => {
            const { overallScore, incentiveHike } = getEmployeeScore(summary.employeeName, summary);
    
            return {
                'Employee Name': summary.employeeName,
                'Total Tasks': summary.totalTasks,
                'Completed Tasks': summary.completed,
                'In Progress Tasks': summary.inProgress,
                'Paused Tasks': summary.paused,
                'Task Completion Rate (%)': summary.completionRate,
                'Due Date Adherence (%)': summary.dueDateAdherenceScore,
                'Subtask Completion (%)': summary.subtaskCompletionRate,
                'Overall Performance Score': overallScore,
                'Incentive Hike (%)': incentiveHike,
            };
        });

        const wsPerformance = XLSX.utils.json_to_sheet(performanceDataForExport);
        const sheetName = isEmployeeDownload ? `${employeeName} Score` : "Overall Performance";
        XLSX.utils.book_append_sheet(wb, wsPerformance, sheetName);
      }


      // 3. Detailed Tasks Sheet
      const dataForExport = tasksForExport.flatMap(task => {
          const mainRow = {
              'Task ID': task.projectId,
              'Item Type': 'Task',
              'Task Name': task.project,
              'Main Assignee': task.assigneeName,
              'Start Date': task.startDate,
              'End Date': task.endDate || 'N/A',
              'Due Date': task.dueDate,
              'Task Progress (%)': task.completion,
              'Task Status': task.status,
              'Task Remarks': task.remarks || '-',
              'Subtask ID': 'N/A',
              'Subtask Title': 'N/A',
              'Subtask Assignee': 'N/A',
              'Subtask Progress (%)': 'N/A',
              'Subtask Status': 'N/A',
              'Subtask Remarks': 'N/A',
          };

          if (!task.subtasks || task.subtasks.length === 0) {
              return [mainRow];
          }

          const subtaskRows = task.subtasks.map(sub => ({
              'Task ID': '',
              'Item Type': 'Subtask',
              'Task Name': `— ${task.project}`,
              'Main Assignee': '',
              'Start Date': '',
              'End Date': '',
              'Due Date': '',
              'Task Progress (%)': '',
              'Task Status': '',
              'Task Remarks': '',
              'Subtask ID': sub.id || 'N/A',
              'Subtask Title': sub.title,
              'Subtask Assignee': sub.assigneeName || 'Unassigned',
              'Subtask Progress (%)': sub.completion,
              'Subtask Status': sub.status,
              'Subtask Remarks': sub.remarks || '-',
          }));

          return [mainRow, ...subtaskRows];
      });

      const wsTasks = XLSX.utils.json_to_sheet(dataForExport);
      const objectKeys = Object.keys(dataForExport[0] || {});
      const wscols = objectKeys.map(key => {
          let max_width = key.length;
          dataForExport.forEach(row => {
              const cellValue = String((row as any)[key] || '');
              max_width = Math.max(max_width, cellValue.length);
          });
          const finalWidth = Math.min(max_width + 2, 60);
          return { wch: finalWidth };
      });

      wsTasks['!cols'] = wscols;

      const detailSheetName = isEmployeeDownload ? `${employeeName} Tasks Detail` : "Tasks Detail Report";
      XLSX.utils.book_append_sheet(wb, wsTasks, detailSheetName);

      const fileName = isEmployeeDownload
        ? `${employeeName.replace(/[^a-z0-9]/gi, '_')}_Performance_Report.xlsx`
        : (downloadFilterType === "all" ? "All_Tasks_Report.xlsx" : `${downloadFilterType}_${safeValue}_Tasks_Report.xlsx`);

      XLSX.writeFile(wb, fileName);
      alert(`✅ Report downloaded as ${fileName}`);
  };

  const handleDownloadEmployeeReport = useCallback((employeeName: string) => {
    handleExcelDownload(employeeName);
  }, [rawFilteredTasks, employeeSummaries, handleExcelDownload]);


  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
        router.push('/');
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading tasks and employees...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Error</h3>
          </div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 h-full w-20 bg-white shadow-xl pt-28 flex flex-col items-center space-y-4 z-20">
        <button
          onClick={() => setViewType("table")}
          className={`p-3 rounded-xl transition-all duration-200 ${
            viewType === "table"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
          }`}
          title="Table View (HR Summary)"
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("overall")}
          className={`p-3 rounded-xl transition-all duration-200 ${
            viewType === "overall"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
          }`}
          title="Overall Performance View (5 Factor Score)"
        >
          <Eye className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("chart")}
          className={`p-3 rounded-xl transition-all duration-200 ${
            viewType === "chart"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
          }`}
          title="Chart View (Analytics)"
        >
          <BarChart2 className="w-6 h-6" />
        </button>
        <div className="flex-grow"></div> 
        <button
          onClick={handleLogout}
          className="p-3 mb-4 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-100 hover:text-red-600"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      <div
        className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8"
        style={{ marginLeft: '5rem' }}
      >
        <div className="max-w-[1800px] mx-auto">

          <TaskTableHeader
            uniqueProjects={uniqueProjects}
            employees={employees}
            downloadFilterType={downloadFilterType}
            setDownloadFilterType={setDownloadFilterType}
            downloadFilterValue={downloadFilterValue}
            setDownloadFilterValue={setDownloadFilterValue}
            xlsxLoaded={xlsxLoaded}
            handleExcelDownload={() => handleExcelDownload('all')}
          />

          {viewType === "table" && (
            <TaskTableView 
                employeeSummaries={employeeSummaries} 
                onDownloadEmployeeReport={handleDownloadEmployeeReport}
            />
          )}

          {viewType === "overall" && (
            <TaskOverallView 
                employeeSummaries={employeeSummaries} 
                onDownloadEmployeeReport={handleDownloadEmployeeReport}
            />
          )}

          {viewType === "chart" && rawFilteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
                  <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No tasks found</h3>
                      <p className="text-slate-500">The current filter returned no matching tasks for the chart view.</p>
                  </div>
              </div>
          ) : (
            <>
              {viewType === "chart" && (
                  <TaskChartView 
                      tasks={rawFilteredTasks}
                  />
              )}
            </>
          )}

          {selectedTaskForModal && (
              <TaskModal
                  task={selectedTaskForModal}
                  isOpen={isModalOpen}
                  onClose={closeTaskModal}
                  isEditing={isEditing}
                  draftTask={draftTask}
                  subtasks={subtasks}
                  employees={employees}
                  currentProjectPrefix={currentProjectPrefix}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleUpdate={handleUpdate}
                  cancelEdit={cancelEdit}
                  handleDraftChange={handleDraftChange}
                  handleSubtaskChange={handleSubtaskChange}
                  addSubtask={addSubtask}
                  removeSubtask={removeSubtask}
                  handleStartSprint={handleStartSprint}
              />
          )}
          
          {/* NEW FULL DOWNLOAD BUTTON */}
          <div className="mt-8 mb-8 text-center">
            <button
                onClick={() => handleExcelDownload('all')}
                disabled={!xlsxLoaded || rawFilteredTasks.length === 0}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                title="Download all filtered tasks and summaries into a multi-sheet Excel file."
            >
                <Download className="w-5 h-5 mr-2" />
                Download Full Report ({rawFilteredTasks.length} items)
            </button>
            {!xlsxLoaded && (
                <p className="text-sm text-red-500 mt-2">XLSX library loading...</p>
            )}
          </div>
          {/* END NEW FULL DOWNLOAD BUTTON */}

        </div>
      </div>
    </div>
  );
};

export default TasksPage;