"use client";

import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { AlertCircle, LayoutGrid, ListTodo, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";

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
  status:
    | "Backlog"
    | "In Progress"
    | "Dev Review"
    | "Deployed in QA"
    | "Test In Progress"
    | "QA Sign Off"
    | "Deployment Stage"
    | "Pilot Test"
    | "Completed"
    | "Paused"
    | string;
  remarks?: string;
  subtasks?: Subtask[];
}

export interface Employee {
  _id: string;
  name: string;
}

export type ViewType = "card" | "board";

type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

const TasksPage: React.FC = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewType, setViewType] = useState<ViewType>("card");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(
    null
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

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
    import("xlsx")
      .then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const role = (localStorage.getItem("userRole") || "") as Role;
      const name = localStorage.getItem("userName") || "";
      setCurrentUserRole(role || null);
      setCurrentUserName(name);
    }

    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setLoading(false);
    };
    init();
  }, []);

  const visibleTasks = useMemo(() => {
    if (currentUserRole === "Employee" && currentUserName.trim()) {
      const nameLower = currentUserName.toLowerCase();
      return tasks.filter(
        (task) => task.assigneeName?.toLowerCase() === nameLower
      );
    }
    return tasks;
  }, [tasks, currentUserRole, currentUserName]);

  const uniqueProjects = useMemo(() => {
    const projectNames = visibleTasks.map((task) => task.project).filter(Boolean);
    return Array.from(new Set(projectNames));
  }, [visibleTasks]);

  const filteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim().toLowerCase();

    if (filter === "all" || !value) {
      return visibleTasks;
    }

    return visibleTasks.filter((task) => {
      switch (filter) {
        case "project":
          return task.project.toLowerCase() === value;

        case "assignee":
          if (value === "all") return true;
          return task.assigneeName.toLowerCase() === value;

        case "status":
          return task.status.toLowerCase() === value;

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

        default:
          return true;
      }
    });
  }, [visibleTasks, downloadFilterType, downloadFilterValue]);

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

    const subtasksWithIDs: Subtask[] = (task.subtasks || []).map(
      (sub, index, arr) => {
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
  };

  const handleDraftChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
          }
        } else {
          alert(
            `❌ Failed to update task status: ${
              data.error || "Unknown error"
            }`
          );
        }
      } catch (err) {
        alert("A server error occurred during status update.");
      }
    },
    []
  );

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
        alert(
          `❌ Failed to update task: ${data.error || "Unknown error"}`
        );
      }
    } catch (err) {
      alert("A server error occurred during update.");
    }
  };

  const handleStartSprint = async (taskId: string) => {
    if (
      !window.confirm(
        "Do you want to start the sprint for this task? Status will change to 'In Progress'."
      )
    )
      return;
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
        alert(
          `❌ Failed to start sprint: ${data.error || "Unknown error"}`
        );
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

  const handleExcelDownload = () => {
    if (typeof window === "undefined" || !(window as any).XLSX) {
      alert("❌ XLSX library not loaded. Please ensure SheetJS is installed.");
      return;
    }

    let tasksForExport: Task[] = [];
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim();

    if (filter === "all" || !value) {
      tasksForExport = visibleTasks;
    } else {
      tasksForExport = visibleTasks.filter((task) => {
        switch (filter) {
          case "project":
            return task.project === value;

          case "assignee":
            if (value.toLowerCase() === "all") return true;
            return (
              task.assigneeName.toLowerCase() === value.toLowerCase()
            );

          case "status":
            return task.status === value;

          case "date":
            return (
              task.startDate === value ||
              task.dueDate === value ||
              (task.endDate && task.endDate === value)
            );

          case "month":
            return (
              task.startDate.startsWith(value) ||
              task.dueDate.startsWith(value) ||
              (task.endDate && task.endDate.startsWith(value))
            );

          default:
            return true;
        }
      });
    }

    if (tasksForExport.length === 0) {
      alert(
        `No tasks found for the current filter: ${
          filter
        } = ${value || "N/A"}`
      );
      return;
    }

    const dataForExport = tasksForExport.flatMap((task) => {
      const mainRow = {
        "Task ID": task.projectId,
        "Item Type": "Task",
        "Task Name": task.project,
        "Main Assignee": task.assigneeName,
        "Start Date": task.startDate,
        "End Date": task.endDate || "N/A",
        "Due Date": task.dueDate,
        "Task Progress (%)": task.completion,
        "Task Status": task.status,
        "Task Remarks": task.remarks || "-",
        "Subtask ID": "N/A",
        "Subtask Title": "N/A",
        "Subtask Assignee": "N/A",
        "Subtask Progress (%)": "N/A",
        "Subtask Status": "N/A",
        "Subtask Remarks": "N/A",
      };

      if (!task.subtasks || task.subtasks.length === 0) {
        return [mainRow];
      }

      const subtaskRows = task.subtasks.map((sub) => ({
        "Task ID": "",
        "Item Type": "Subtask",
        "Task Name": `— ${task.project}`,
        "Main Assignee": "",
        "Start Date": "",
        "End Date": "",
        "Due Date": "",
        "Task Progress (%)": "",
        "Task Status": "",
        "Task Remarks": "",
        "Subtask ID": sub.id || "N/A",
        "Subtask Title": sub.title,
        "Subtask Assignee": sub.assigneeName || "Unassigned",
        "Subtask Progress (%)": sub.completion,
        "Subtask Status": sub.status,
        "Subtask Remarks": sub.remarks || "-",
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
    XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");

    const safeValue = value.replace(/[^a-z0-9]/gi, "_");
    const fileName =
      filter === "all"
        ? "All_Tasks_Report.xlsx"
        : `${filter}_${safeValue}_Tasks_Report.xlsx`;

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
      <div className="flex justify-center items-center min-h-screen ">
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
    <div className="flex min-h-screen">
      <aside className="fixed left-0 top-0 h-full w-20 bg-white shadow-xl pt-28 flex flex-col items-center space-y-4 z-20">
        <button
          onClick={() => setViewType("card")}
          className={`p-3 rounded-xl transition-all duration-200 ${
            viewType === "card"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
          }`}
          title="Card View (3 in a row)"
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("board")}
          className={`p-3 rounded-xl transition-all duration-200 ${
            viewType === "board"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
          }`}
          title="Board View (Kanban)"
        >
          <ListTodo className="w-6 h-6" />
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
        className="flex-1 min-h-screen mt-[5%] py-8 px-4 sm:px-6 lg:px-8"
        style={{ marginLeft: "5rem" }}
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
                  The current filter returned no matching tasks.
                </p>
              </div>
            </div>
          ) : (
            <>
              {viewType === "card" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </div>
    </div>
  );
};

export default TasksPage;