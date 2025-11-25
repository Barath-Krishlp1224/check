// ./TasksPage.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, LayoutGrid, ListTodo, LogOut, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SetStateAction, Dispatch } from "react"; 

import TaskTableHeader from "./components/TaskTableHeader";
// import TaskCard from "./components/TaskCard"; // REMOVED
// Import the new Table Summary component
import EmployeeTaskSummaryTable from "./components/TaskCard"; 
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import TaskChartView from "./components/TaskChartView";

// IMPORT CORRECT TYPES from the unified file
import { 
    Task, 
    Employee,
    ViewType,
} from "./components/types"; 

const TasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewType, setViewType] = useState<ViewType>("card"); // 'card' view will now show the table

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({}); 
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  // Define All possible Task Statuses for the select dropdown
  const allTaskStatuses = useMemo(() => [
    "Backlog", "In Progress", "Dev Review", "Deployed in QA", 
    "Test In Progress", "QA Sign Off", "Deployment Stage", 
    "Pilot Test", "Completed", "Paused"
  ], []);


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
      if (res.ok && data.success) setTasks(data.tasks.map((t: Task) => ({...t, subtasks: []}))); 
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
    import("xlsx")
      .then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
      })
      .catch((err) => {});

    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setLoading(false);
    };
    init();
  }, []);

  const uniqueProjects = useMemo(() => {
    const projectNames = tasks.map((task) => task.project).filter(Boolean);
    return Array.from(new Set(projectNames));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    let value = downloadFilterValue.trim().toLowerCase();

    let primaryFilterValue = value;
    let fromDateString = "";
    let toDateString = "";

    if (value.includes("|")) {
      const parts = value.split("|");
      primaryFilterValue = parts[0];
      fromDateString = parts[1];
      toDateString = parts[2];
      value = primaryFilterValue;
    }

    if (filter === "all" && !primaryFilterValue && !fromDateString && !toDateString) {
      return tasks;
    }

    return tasks.filter((task) => {
      let isPrimaryMatch = true;

      switch (filter) {
        case "project":
          isPrimaryMatch = primaryFilterValue === "" || task.project.toLowerCase() === primaryFilterValue;
          break;

        case "assignee":
          const assigneeFilterNames = primaryFilterValue.split('#').filter(name => name.trim() !== '');
          
          if (assigneeFilterNames.length === 0) {
              isPrimaryMatch = true;
          } else if (assigneeFilterNames.includes("all")) {
              isPrimaryMatch = true;
          } else {
              isPrimaryMatch = task.assigneeNames.some(taskAssignee => 
                  assigneeFilterNames.includes(taskAssignee.toLowerCase())
              );
          }
          break;

        case "status":
          isPrimaryMatch = primaryFilterValue === "" || task.status.toLowerCase() === primaryFilterValue;
          break;

        case "date":
          return (
            task.startDate === downloadFilterValue ||
            task.dueDate === downloadFilterValue ||
            (task.endDate && task.endDate === downloadFilterValue)
          );

        case "month":
          return (
            task.startDate.startsWith(downloadFilterValue) ||
            task.dueDate.startsWith(downloadFilterValue) ||
            (task.endDate && task.endDate.startsWith(downloadFilterValue))
          );

        case "all":
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

      const taskDates = [task.startDate, task.dueDate, task.endDate].filter((d) => d).map((d) => new Date(d as string));

      return taskDates.some((taskDate) => {
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


  const openTaskModal = (task: Task) => {
    setSelectedTaskForModal(task);
    setIsModalOpen(true);
    setIsEditing(false);
    
    setDraftTask({
        ...task,
        assigneeNames: task.assigneeNames || [],
    });
    
    setCurrentProjectPrefix(task.projectId);
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
    setDraftTask({
        ...task,
        assigneeNames: task.assigneeNames || [],
    });
    setCurrentProjectPrefix(task.projectId);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraftTask({});
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
        setTasks((prevTasks) => prevTasks.map((task) => (task._id === taskId ? { ...task, status: newStatus as Task["status"] } : task)));
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

    const updatedTask = {
      ...draftTask,
      projectId: currentProjectPrefix,
      subtasks: [], 
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
    await onTaskStatusChange(taskId, "In Progress");
    alert("🚀 Sprint started! Task status is now 'In Progress'.");
    closeTaskModal();
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


  const handleExcelDownload = () => {
    if (typeof window === "undefined" || !(window as any).XLSX) {
      alert("❌ XLSX library not loaded. Please ensure SheetJS is installed.");
      return;
    }

    let tasksForExport: Task[] = [];
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim();

    if (filter === "all" || !value) {
      tasksForExport = tasks;
    } else {
      tasksForExport = tasks.filter((task) => {
        switch (filter) {
          case "project":
            return task.project === value;

          case "assignee":
            const assigneeNamesFilter = value.toLowerCase().split('#');

            if (value.toLowerCase() === "all" || assigneeNamesFilter.length === 0) return true;
            
            return task.assigneeNames.some(taskAssignee => 
                assigneeNamesFilter.includes(taskAssignee.toLowerCase())
            );

          case "status":
            return task.status === value;

          case "date":
            return task.startDate === value || task.dueDate === value || (task.endDate && task.endDate === value);

          case "month":
            return task.startDate.startsWith(value) || task.dueDate.startsWith(value) || (task.endDate && task.endDate.startsWith(value));

          default:
            return true;
        }
      });
    }

    if (tasksForExport.length === 0) {
      alert(`No tasks found for the current filter: ${filter} = ${value || "N/A"}`);
      return;
    }

    const dataForExport = tasksForExport.map((task) => ({
      TaskID: task.projectId,
      TaskName: task.project,
      MainAssignees: task.assigneeNames.join(', '), 
      StartDate: task.startDate,
      EndDate: task.endDate || "N/A",
      DueDate: task.dueDate,
      TaskProgress: task.completion,
      TaskStatus: task.status,
      TaskRemarks: task.remarks || "-",
    }));

    const XLSX = (window as any).XLSX;
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    const objectKeys = Object.keys(dataForExport[0] || {});
    const wscols = objectKeys.map((key) => {
      let max_width = key.length;
      dataForExport.forEach((row) => {
        const cellValue = String((row as any)[key] || "");
        max_width = Math.max(max_width, cellValue.length);
      });
      const finalWidth = Math.min(max_width + 2, 60);
      return { wch: finalWidth };
    });

    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");

    const safeValue = value.replace(/[^a-z0-9]/gi, "_");
    const fileName = filter === "all" ? "All_Tasks_Report.xlsx" : `${filter}_${safeValue}_Tasks_Report.xlsx`;

    XLSX.writeFile(wb, fileName);
    alert(`✅ Task report downloaded as ${fileName}`);
  };


  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      router.push("/");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading tasks and employees...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
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
    <div className="flex min-h-screen bg-white">
      <aside className="fixed left-0 top-0 h-full w-20 bg-white shadow-xl pt-28 flex flex-col items-center space-y-4 z-20">
        <button
          onClick={() => setViewType("card")}
          className={`p-3 rounded-xl transition-all duration-200 ${viewType === "card" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"}`}
          title="Employee Task Summary Table"
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("board")}
          className={`p-3 rounded-xl transition-all duration-200 ${viewType === "board" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"}`}
          title="Board View (Kanban)"
        >
          <ListTodo className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("chart")}
          className={`p-3 rounded-xl transition-all duration-200 ${viewType === "chart" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"}`}
          title="Chart View (Analytics)"
        >
          <BarChart2 className="w-6 h-6" />
        </button>
        <div className="flex-grow" />
        <button onClick={handleLogout} className="p-3 mb-4 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-100 hover:text-red-600" title="Logout">
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      <div className="flex-1 min-h-screen mt-[5%] py-8 px-4 sm:px-6 lg:px-8" style={{ marginLeft: "5rem", backgroundColor: "#ffffff" }}>
        <div className="max-w-[1800px] mx-auto">
          <TaskTableHeader
            uniqueProjects={uniqueProjects}
            employees={employees}
            downloadFilterType={downloadFilterType}
            setDownloadFilterType={setDownloadFilterType}
            downloadFilterValue={downloadFilterValue}
            setDownloadFilterValue={setDownloadFilterValue}
            xlsxLoaded={xlsxLoaded}
            handleExcelDownload={handleExcelDownload}
          />

          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No tasks found</h3>
                <p className="text-slate-500">The current filter returned no matching tasks.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Card view replaced by the Summary Table */}
              {viewType === "card" && (
                <EmployeeTaskSummaryTable tasks={filteredTasks} employees={employees} />
              )}

              {viewType === "board" && <TaskBoardView tasks={filteredTasks} openTaskModal={openTaskModal} onTaskStatusChange={onTaskStatusChange} />}

              {viewType === "chart" && <TaskChartView tasks={filteredTasks} />}
            </>
          )}

          {selectedTaskForModal && (
            <TaskModal
              task={selectedTaskForModal}
              isOpen={isModalOpen}
              onClose={closeTaskModal}
              isEditing={isEditing}
              draftTask={draftTask}
              setDraftTask={setDraftTask as Dispatch<SetStateAction<Partial<Task>>>} 
              employees={employees}
              currentProjectPrefix={currentProjectPrefix}
              allTaskStatuses={allTaskStatuses} 
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              cancelEdit={cancelEdit}
              handleDraftChange={handleDraftChange}
              handleStartSprint={handleStartSprint}
              onTaskStatusChange={onTaskStatusChange} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;