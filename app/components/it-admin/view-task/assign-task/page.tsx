"use client";
import React, { useState, useEffect, useMemo, useCallback, ChangeEvent } from "react";
import { AlertCircle, LayoutGrid, ListTodo, Calendar, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import HolidaysModal from "./components/HolidaysModal";
import SubtaskModal from "./components/SubtaskModal";
import CreateTaskModal, { Employee } from "./components/CreateTaskModal";
import { Task, Subtask, SubtaskChangeHandler, SubtaskPathHandler } from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board";
type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

const allTaskStatuses = [
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
];

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
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [isHolidaysOpen, setIsHolidaysOpen] = useState(false);

  // create task modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const getNewSubtask = (prefix: string, path: number[]): Subtask => ({
    id: prefix + (path.length > 0 ? `.${path.join(".")}` : "-S1"),
    title: "",
    assigneeName: "",
    status: "Pending",
    completion: 0,
    remarks: "",
    subtasks: [],
    isEditing: true,
    isExpanded: true,
    date: new Date().toISOString().split("T")[0],
    timeSpent: "",
    storyPoints: 0,
  });

  const updateSubtaskState = (
    currentSubs: Subtask[],
    path: number[],
    updater: (sub: Subtask, index: number) => Subtask | null,
    action: "update" | "remove" | "add" = "update"
  ): Subtask[] => {
    let newSubs = [...currentSubs];
    let currentLevel: Subtask[] = newSubs;
    for (let i = 0; i < path.length; i++) {
      const index = path[i];
      if (!currentLevel) return currentSubs;
      if (i === path.length - 1) {
        if (action === "remove") {
          currentLevel.splice(index, 1);
        } else if (action === "add") {
          const parent = currentLevel[index];
          if (!parent.subtasks) parent.subtasks = [];
          const nextSubIndex = parent.subtasks.length;
          const newPath = [...path, nextSubIndex];
          const newNestedId = (parent.id || currentProjectPrefix) + `.${nextSubIndex + 1}`;
          parent.subtasks.push({
            ...getNewSubtask(currentProjectPrefix, newPath),
            id: newNestedId,
          });
        } else {
          const updatedSub = updater(currentLevel[index], index);
          if (updatedSub) {
            currentLevel[index] = updatedSub;
          }
        }
      } else {
        const sub: Subtask = currentLevel[index];
        if (!sub || !sub.subtasks) return currentSubs;
        currentLevel = sub.subtasks;
      }
    }
    return newSubs;
  };

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
      // ignore
    }
  };

  const triggerDueDateNotifications = async () => {
    try {
      const url = getApiUrl("/api/tasks/reminders");
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn("Reminders job failed:", data.error || "Unknown error");
      } else {
        console.log(
          `Reminders done. Reminders: ${data.remindersSent}, overdue: ${data.overdueAlertsSent}`
        );
      }
    } catch (err) {
      console.warn("Error calling reminders API:", err);
    }
  };

  const handleCreateTask = () => {
    setIsCreateModalOpen(true);
  };

  const handleTaskCreated = async () => {
    await fetchTasks();
    await fetchEmployees();
  };

  // ✅ enforce loader for at least 3 seconds
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

    let isMounted = true;
    const MIN_LOADER_TIME = 3000; // 3 seconds
    const startTime = Date.now();

    const init = async () => {
      setLoading(true);
      setError("");

      await Promise.all([fetchTasks(), fetchEmployees()]);
      await triggerDueDateNotifications();

      const elapsed = Date.now() - startTime;
      const remaining = MIN_LOADER_TIME - elapsed;

      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleTasks = useMemo(() => {
    if (currentUserRole === "Employee" && currentUserName.trim()) {
      const nameLower = currentUserName.toLowerCase();

      return tasks.filter((task) => {
        if (task.assigneeNames && Array.isArray(task.assigneeNames)) {
          return task.assigneeNames.some(
            (assignee) => assignee.toLowerCase() === nameLower
          );
        }
        return false;
      });
    }
    return tasks;
  }, [tasks, currentUserRole, currentUserName]);

  const uniqueProjects = useMemo(() => {
    const names = visibleTasks.map((task) => task.project).filter(Boolean);
    return Array.from(new Set(names));
  }, [visibleTasks]);

  const filteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim().toLowerCase();

    if (filter === "all" || !value) return visibleTasks;

    return visibleTasks.filter((task) => {
      switch (filter) {
        case "project":
          return task.project.toLowerCase() === value;
        case "assignee":
          if (value === "all") return true;
          return (task.assigneeNames || []).some(
            (assignee) => assignee.toLowerCase() === value
          );
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

  const openTaskModal = (task: Task) => {
    const aggregatedTask = getAggregatedTaskData(task);
    setSelectedTaskForModal(aggregatedTask);
    setIsModalOpen(true);
    setIsEditing(false);
    setDraftTask({});
    setSubtasks(aggregatedTask.subtasks || []);
    setCurrentProjectPrefix(aggregatedTask.projectId);
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
    setSubtasks(JSON.parse(JSON.stringify(task.subtasks || [])));
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
    const { name, value, type } = e.target;
    let finalValue: string | string[] | number = value;

    if (name === "completion" || name === "taskStoryPoints") {
      finalValue = Number(value);
    } else if (name === "assigneeNames" && type === "select-multiple") {
      const select = e.target as HTMLSelectElement;
      finalValue = Array.from(select.selectedOptions, (option) => option.value);
    } else if (name === "assigneeNames") {
      finalValue = [value];
    }

    setDraftTask((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubtaskChange: SubtaskChangeHandler = (path, field, value) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({
        ...sub,
        [field]: value,
      }))
    );
  };

  const handleToggleEdit: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({
        ...sub,
        isEditing: !(sub.isEditing ?? false),
      }))
    );
  };

  const handleToggleExpansion: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({
        ...sub,
        isExpanded: !(sub.isExpanded ?? false),
      }))
    );
  };

  const addSubtask: SubtaskPathHandler = (path) => {
    if (!currentProjectPrefix) return;
    if (path.length === 0) {
      setSubtasks((prevSubs) => [
        ...prevSubs,
        {
          ...getNewSubtask(currentProjectPrefix, [prevSubs.length]),
          id: `${currentProjectPrefix}-S${prevSubs.length + 1}`,
        },
      ]);
      return;
    }
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, () => null, "add")
    );
  };

  const removeSubtask: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, () => null, "remove")
    );
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
        setTasks((prev) =>
          prev.map((t) =>
            t._id === taskId ? { ...t, status: newStatus as Task["status"] } : t
          )
        );
        fetchTasks();
      } else {
        alert(data.error || "Failed to update task");
      }
    } catch (err) {
      alert("Server error during status update.");
    }
  }, []);

  const findAndMapSubtasks = (
    subs: Subtask[],
    subtaskId: string,
    newStatus: string
  ): Subtask[] => {
    return subs.map((sub) => {
      if (sub.id === subtaskId) {
        return { ...sub, status: newStatus };
      }
      if (sub.subtasks) {
        return {
          ...sub,
          subtasks: findAndMapSubtasks(sub.subtasks, subtaskId, newStatus),
        };
      }
      return sub;
    });
  };

  const onSubtaskStatusChange = useCallback(
    async (taskId: string, subtaskId: string, newStatus: string) => {
      try {
        const target = tasks.find((t) => t._id === taskId);
        if (!target) return;
        const updatedSubs = findAndMapSubtasks(
          target.subtasks || [],
          subtaskId,
          newStatus
        );
        const url = getApiUrl(`/api/tasks/${taskId}`);
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtasks: updatedSubs }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          fetchTasks();
        } else {
          alert(data.error || "Failed to update subtask");
        }
      } catch (err) {
        alert("Server error during subtask update.");
      }
    },
    [tasks]
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;

    const filterEmptySubs = (subs: Subtask[]): Subtask[] => {
      return subs.filter((s) => {
        if (s.title.trim() === "") return false;
        if (s.subtasks) s.subtasks = filterEmptySubs(s.subtasks);
        return true;
      });
    };

    const validSubs = filterEmptySubs(subtasks);

    const updatedTask = {
      ...draftTask,
      subtasks: validSubs,
      projectId: currentProjectPrefix,
      taskTimeSpent: draftTask.taskTimeSpent,
      taskStoryPoints: draftTask.taskStoryPoints,
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
        alert("Task updated!");
        closeTaskModal();
        fetchTasks();
      } else {
        alert(data.error || "Failed to update task");
      }
    } catch (err) {
      alert("Server error during update.");
    }
  };

  const handleStartSprint = async (taskId: string) => {
    if (
      !window.confirm(
        "Start sprint for this task? Status will change to 'In Progress'."
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
        closeTaskModal();
        fetchTasks();
      } else {
        alert(data.error || "Failed to start sprint");
      }
    } catch (err) {
      alert("Server error during sprint start.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${id}`);
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        closeTaskModal();
        fetchTasks();
      } else {
        alert(data.error || "Failed to delete task");
      }
    } catch (err) {
      alert("Server error during deletion.");
    }
  };

  // 🔄 GIF LOADER WITH 3-SECOND MINIMUM
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        
          <div className="w-100 h-70 relative mb-4">
            <Image
              src="/load.gif" // change path if your GIF is elsewhere
              alt="Loading tasks..."
              fill
              className="object-contain"
              priority
              unoptimized
            />
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
    <div className="flex flex-col min-h-screen">
      <aside className="fixed top-40 left-1/2 transform -translate-x-1/2 w-[300px] h-16 bg-white rounded-full shadow-2xl flex items-center justify-center px-4 z-50 border-b border-gray-200 space-x-8">
        <button
          onClick={() => setViewType("card")}
          className={`p-3 rounded-full transition-all duration-200 flex items-center text-sm ${
            viewType === "card"
              ? "text-indigo-600 font-bold bg-indigo-100"
              : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
          }`}
          title="Card View (3 in a row)"
        >
          <LayoutGrid className="w-6 h-6" />
        </button>
        <button
          onClick={() => setViewType("board")}
          className={`p-3 rounded-full transition-all duration-200 flex items-center text-sm ${
            viewType === "board"
              ? "text-indigo-600 font-bold bg-indigo-100"
              : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
          }`}
          title="Board View (Kanban)"
        >
          <ListTodo className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsHolidaysOpen(true)}
          className={`p-3 rounded-full transition-all duration-200 flex items-center text-sm ${
            isHolidaysOpen
              ? "text-indigo-600 font-bold bg-indigo-100"
              : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
          }`}
          title="National Holidays"
        >
          <Calendar className="w-6 h-6" />
        </button>
      </aside>

      <main className="flex-1 min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-full mx-auto">
          <TaskTableHeader
            uniqueProjects={uniqueProjects}
            employees={employees}
            downloadFilterType={downloadFilterType}
            setDownloadFilterType={setDownloadFilterType}
            downloadFilterValue={downloadFilterValue}
            setDownloadFilterValue={setDownloadFilterValue}
            xlsxLoaded={xlsxLoaded}
            handleExcelDownload={() => {}}
          />
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No tasks found
                </h3>
                <p className="text-slate-500">Try adjusting filters.</p>
              </div>
            </div>
          ) : (
            <>
              {viewType === "card" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
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
              allTaskStatuses={allTaskStatuses}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleUpdate={handleUpdate}
              cancelEdit={cancelEdit}
              handleDraftChange={handleDraftChange}
              handleSubtaskChange={handleSubtaskChange}
              addSubtask={addSubtask}
              removeSubtask={removeSubtask}
              onToggleEdit={handleToggleEdit}
              onToggleExpansion={handleToggleExpansion}
              handleStartSprint={handleStartSprint}
              onTaskStatusChange={onTaskStatusChange}
              onSubtaskStatusChange={onSubtaskStatusChange}
            />
          )}
        </div>
      </main>

      <HolidaysModal
        open={isHolidaysOpen}
        onClose={() => setIsHolidaysOpen(false)}
      />

      <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-4 z-50">
        <button
          onClick={handleCreateTask}
          className="group p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 relative"
          title="Create New Task"
        >
          <Plus className="w-6 h-6" />
          <span className="absolute right-full mr-4 p-2 text-sm bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Create Task
          </span>
        </button>
      </div>

      <CreateTaskModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleTaskCreated}
        employees={employees}
        getApiUrl={getApiUrl}
        allTaskStatuses={allTaskStatuses}
      />
    </div>
  );
};

export default TasksPage;
