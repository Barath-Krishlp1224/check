// ./TasksPage.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AlertCircle, LayoutGrid, ListTodo, BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SetStateAction, Dispatch } from "react";

import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import TaskChartView from "./components/TaskChartView";

// IMPORT CORRECT TYPES from the unified file
import {
  Task,
  Subtask,
  Employee,
  ViewType,
  SubtaskChangeHandler,
  SubtaskPathHandler,
} from "./components/types";

// 🚀 React-Toastify Imports
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Assuming getAggregatedTaskData is still available, but commenting out as it wasn't in the provided imports
// import { getAggregatedTaskData } from "./utils/aggregation"; 


const TasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewType, setViewType] = useState<ViewType>("card");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  // These states can remain for TaskTableHeader but will no longer affect listing/export
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  // Define All possible Task Statuses for the select dropdown
  const allTaskStatuses = useMemo(
    () => [
      "Backlog",
      "In Progress",
      "Dev Review",
      "Deployed in QA",
      "Test In Progress",
      "QA Sign Off",
      "Deployment Stage",
      "Pilot Test",
      "Completed",
      "Paused",
    ],
    []
  );

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
      else {
        setError(data.error || "Failed to fetch tasks.");
        toast.error(data.error || "Failed to fetch tasks.");
      }
    } catch (err) {
      setError("Server connection error while fetching tasks.");
      toast.error("Server connection error while fetching tasks.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const url = getApiUrl("/api/employees");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
    } catch (err) {}
  };

  useEffect(() => {
    import("xlsx")
      .then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
      })
      .catch((err) => {
        toast.warn("XLSX library failed to load. Export feature may be unavailable.");
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
    const projectNames = tasks.map((task) => task.project).filter(Boolean);
    return Array.from(new Set(projectNames));
  }, [tasks]);

  // ✅ NO FILTERS: just show all tasks
  const filteredTasks = useMemo(() => tasks, [tasks]);

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

    setDraftTask({
      ...task,
      assigneeNames: task.assigneeNames || [],
    });

    setSubtasks(task.subtasks || []);
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

    const subtasksWithIDs: Subtask[] = (task.subtasks || []).map(
      (sub, index, arr) => {
        // Simple check to ensure subtasks have an ID suitable for the current task
        if (!sub.id || !sub.id.startsWith(task.projectId)) {
          const tempId = generateNextSubtaskId(
            task.projectId,
            arr.slice(0, index)
          );
          return { ...sub, id: tempId };
        }
        return sub;
      }
    );
    setSubtasks(subtasksWithIDs);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraftTask({});
    setSubtasks([]);
    setCurrentProjectPrefix("");
    toast.info("Task edit cancelled.");
  };

  const handleDraftChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setDraftTask((prev) => ({
      ...prev,
      [name]: name === "completion" ? Number(value) : value,
    }));
  };

  const handleSubtaskChange: SubtaskChangeHandler = (path, field, value) => {
    const index = path[0];
    if (index === undefined || index < 0 || index >= subtasks.length) return;

    setSubtasks((prev) => {
      const updated = [...prev];
      (updated[index] as any)[field] =
        field === "completion" ? Number(value) : value;
      return updated;
    });
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
      } as Subtask,
    ]);
    toast.success("New subtask draft added.");
  };

  const removeSubtask: SubtaskPathHandler = (path) => {
    const index = path[0];
    if (index === undefined || index < 0 || index >= subtasks.length) return;

    setSubtasks((prev) => prev.filter((_, i) => i !== index));
    toast.info("Subtask removed from draft.");
  };

  // Existing function for main task status change (ASYNC)
  const onTaskStatusChange = useCallback(
    async (taskId: string, newStatus: string) => {
      try {
        const url = getApiUrl(`/api/tasks/${taskId}`);
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task._id === taskId
                ? { ...task, status: newStatus as Task["status"] }
                : task
            )
          );
          fetchTasks();

          const statusesToNotify = [
            "Backlog",
            "In Progress",
            "Paused",
            "Completed",
          ];
          if (statusesToNotify.includes(newStatus)) {
            console.log(
              `Slack Notification Triggered for Task ${taskId}: Status changed to ${newStatus}`
            );
            toast.success(`Task ${taskId} status changed to ${newStatus}.`);
          }
        } else {
          toast.error(
            `❌ Failed to update task status: ${
              data.error || "Unknown error"
            }`
          );
        }
      } catch (err) {
        toast.error("A server error occurred during status update.");
      }
    },
    []
  );

  // Subtask Status Change (local only for this simplified version)
  const onSubtaskStatusChange = useCallback(
    (taskId: string, subtaskId: string, newStatus: string) => {
      setSubtasks((prevSubtasks) =>
        prevSubtasks.map((sub) =>
          sub.id === subtaskId ? { ...sub, status: newStatus } : sub
        )
      );

      console.log(
        `Subtask status update locally applied: Task ${taskId}, Subtask ${subtaskId} -> ${newStatus}`
      );
      toast.info(`Subtask status for ${subtaskId} updated to ${newStatus} (local change).`);
    },
    []
  );

  const onToggleEdit: SubtaskPathHandler = () => {
    // Placeholder function
  };

  const onToggleExpansion: SubtaskPathHandler = () => {
    // Placeholder function
  };

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
        toast.success("✅ Task updated successfully!");
        closeTaskModal();
        fetchTasks();
      } else {
        toast.error(
          `❌ Failed to update task: ${data.error || "Unknown error"}`
        );
      }
    } catch (err) {
      toast.error("A server error occurred during update.");
    }
  };

  const handleStartSprint = async (taskId: string) => {
    if (
      !window.confirm(
        "Do you want to start the sprint for this task? Status will change to 'In Progress'."
      )
    )
      return;
      
    await onTaskStatusChange(taskId, "In Progress");
    toast.success("🚀 Sprint initiated! Task status is now 'In Progress'.");
    closeTaskModal();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${id}`);
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Task deleted successfully!");
        closeTaskModal();
        fetchTasks();
      } else toast.error(data.error || "Failed to delete task.");
    } catch (err) {
      toast.error("Server error during deletion.");
    }
  };

  // ✅ Excel export: export ALL tasks, ignore filters
  const handleExcelDownload = () => {
    if (typeof window === "undefined" || !(window as any).XLSX) {
      toast.error("❌ XLSX library not loaded. Please ensure SheetJS is available.");
      return;
    }

    const tasksForExport: Task[] = tasks;

    if (tasksForExport.length === 0) {
      toast.warn("No tasks found to export.");
      return;
    }

    const dataForExport = tasksForExport.flatMap((task) => {
      const mainRow = {
        TaskID: task.projectId,
        ItemType: "Task",
        TaskName: task.project,
        MainAssignees: task.assigneeNames.join(", "),
        StartDate: task.startDate,
        EndDate: task.endDate || "N/A",
        DueDate: task.dueDate,
        TaskProgress: task.completion,
        TaskStatus: task.status,
        TaskRemarks: task.remarks || "-",
        SubtaskID: "N/A",
        SubtaskTitle: "N/A",
        SubtaskAssignee: "N/A",
        SubtaskProgress: "N/A",
        SubtaskStatus: "N/A",
        SubtaskRemarks: "N/A",
      };

      if (!task.subtasks || task.subtasks.length === 0) {
        return [mainRow];
      }

      const subtaskRows = task.subtasks.map((sub) => ({
        TaskID: "",
        ItemType: "Subtask",
        TaskName: `— ${task.project}`,
        MainAssignees: "",
        StartDate: "",
        EndDate: "",
        DueDate: "",
        TaskProgress: "",
        TaskStatus: "",
        TaskRemarks: "",
        SubtaskID: sub.id || "N/A",
        SubtaskTitle: sub.title,
        SubtaskAssignee: sub.assigneeName || "Unassigned",
        SubtaskProgress: sub.completion,
        SubtaskStatus: sub.status,
        SubtaskRemarks: sub.remarks || "-",
      }));

      return [mainRow, ...subtaskRows];
    });

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
    XLSX.utils.book_append_sheet(wb, ws, "All Tasks Report");

    const fileName = "All_Tasks_Report.xlsx";

    XLSX.writeFile(wb, fileName);
    toast.success(`✅ Task report downloaded as ${fileName}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">
            Loading tasks and employees...
          </p>
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
      {/* 🟢 Toast Container */}
      <ToastContainer 
        position="bottom-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />

      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        <nav className="fixed top-30 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 z-20 border border-gray-200">
          <button
            onClick={() => setViewType("card")}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewType === "card"
                ? "bg-green-600 text-white shadow-lg" // Changed from indigo-600 to green-600
                : "text-gray-500 hover:bg-gray-100 hover:text-green-600" // Changed from indigo-600 to green-600
            }`}
            title="Card View (3 in a row)"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button
            onClick={() => setViewType("board")}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewType === "board"
                ? "bg-green-600 text-white shadow-lg" // Changed from indigo-600 to green-600
                : "text-gray-500 hover:bg-gray-100 hover:text-green-600" // Changed from indigo-600 to green-600
            }`}
            title="Board View (Kanban)"
          >
            <ListTodo className="w-6 h-6" />
          </button>
          <button
            onClick={() => setViewType("chart")}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewType === "chart"
                ? "bg-green-600 text-white shadow-lg" // Changed from indigo-600 to green-600
                : "text-gray-500 hover:bg-gray-100 hover:text-green-600" // Changed from indigo-600 to green-600
            }`}
            title="Chart View (Analytics)"
          >
            <BarChart2 className="w-6 h-6" />
          </button>
        </nav>

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
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No tasks found
                </h3>
                <p className="text-slate-500">
                  There are no tasks available to display.
                </p>
              </div>
            </div>
          ) : (
            <>
              {viewType === "card" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onViewDetails={openTaskModal}
                    />
                  ))}
                </div>
              )}

              {viewType === "board" && (
                <TaskBoardView
                  tasks={filteredTasks}
                  openTaskModal={openTaskModal}
                  onTaskStatusChange={onTaskStatusChange}
                />
              )}

              {viewType === "chart" && (
                <TaskChartView tasks={filteredTasks} />
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
              setDraftTask={
                setDraftTask as Dispatch<SetStateAction<Partial<Task>>>
              }
              subtasks={subtasks}
              employees={employees}
              currentProjectPrefix={currentProjectPrefix}
              allTaskStatuses={allTaskStatuses}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              cancelEdit={cancelEdit}
              handleDraftChange={handleDraftChange}
              handleSubtaskChange={handleSubtaskChange}
              addSubtask={addSubtask}
              removeSubtask={removeSubtask}
              handleStartSprint={handleStartSprint}
              onToggleEdit={onToggleEdit}
              onToggleExpansion={onToggleExpansion}
              onTaskStatusChange={onTaskStatusChange}
              onSubtaskStatusChange={onSubtaskStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;