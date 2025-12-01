"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
} from "react";
import {
  AlertCircle,
  LayoutGrid,
  ListTodo,
  BarChart2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import TaskBoardView from "./components/TaskBoardView";
import TaskChartView from "./components/TaskChartView";

import {
  Task,
  Subtask,
  Employee,
  SubtaskChangeHandler,
  SubtaskPathHandler,
} from "./components/types";
import { getAggregatedTaskData } from "./utils/aggregation";

export type ViewType = "card" | "board" | "chart";

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
  const [selectedTaskForModal, setSelectedTaskForModal] =
    useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] =
    useState<string>("");
  const [downloadFilterType, setDownloadFilterType] =
    useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] =
    useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

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
          const newNestedId =
            (parent.id || currentProjectPrefix) + `.${nextSubIndex + 1}`;
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
      // silently ignore for now
    }
  };

  const triggerDueDateNotifications = async () => {
    try {
      const url = getApiUrl("/api/tasks/reminders");
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn(
          "Reminders job failed:",
          data.error || "Unknown error"
        );
      }
    } catch (err) {
      console.warn("Error calling reminders API:", err);
    }
  };

  useEffect(() => {
    import("xlsx")
      .then((XLSX) => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
      })
      .catch(() => {});

    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      await triggerDueDateNotifications();
      setLoading(false);
    };

    init();
  }, []);

  // 🔹 Only Tech & IT Admin employees (for assignee dropdowns)
  const techEmployees = useMemo(
    () =>
      employees.filter((e) => {
        const team = (e as any).team?.toLowerCase?.();
        return team === "tech" || team === "it admin";
      }),
    [employees]
  );

  // 🔹 Only Tech & IT Admin tasks — NO LOGIN FILTERING
  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      const dept = (task.department || "").toLowerCase();
      // match "tech", "tech team", "it admin", "it admin team", etc.
      return dept.includes("tech") || dept.includes("it admin");
    });
  }, [tasks]);

  const uniqueProjects = useMemo(() => {
    return Array.from(
      new Set(visibleTasks.map((task) => task.project).filter(Boolean))
    );
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
          return value === "all"
            ? true
            : task.assigneeNames?.some(
                (assignee) => assignee.toLowerCase() === value
              );
        case "status":
          return task.status.toLowerCase() === value;
        case "date":
          return [task.startDate, task.dueDate, task.endDate].includes(
            downloadFilterValue
          );
        case "month":
          return (
            task.startDate.startsWith(downloadFilterValue) ||
            task.dueDate.startsWith(downloadFilterValue) ||
            (task.endDate &&
              task.endDate.startsWith(downloadFilterValue))
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
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | string[] | number = value;

    if (name === "completion" || name === "taskStoryPoints") {
      finalValue = Number(value);
    } else if (name === "assigneeNames" && type === "select-multiple") {
      finalValue = Array.from(
        (e.target as HTMLSelectElement).selectedOptions,
        (option) => option.value
      );
    } else if (name === "assigneeNames") {
      finalValue = [value];
    }

    setDraftTask((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubtaskChange: SubtaskChangeHandler = (
    path,
    field,
    value
  ) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({ ...sub, [field]: value }))
    );
  };

  const handleToggleEdit: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({
        ...sub,
        isEditing: !sub.isEditing,
      }))
    );
  };

  const handleToggleExpansion: SubtaskPathHandler = (path) => {
    setSubtasks((prevSubs) =>
      updateSubtaskState(prevSubs, path, (sub) => ({
        ...sub,
        isExpanded: !sub.isExpanded,
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
          setTasks((prev) =>
            prev.map((t) =>
              t._id === taskId
                ? { ...t, status: newStatus as Task["status"] }
                : t
            )
          );
          fetchTasks();
        } else {
          alert(data.error || "Failed to update task");
        }
      } catch {
        alert("Server error during status update.");
      }
    },
    []
  );

  const findAndMapSubtasks = (
    subs: Subtask[],
    subtaskId: string,
    newStatus: string
  ): Subtask[] =>
    subs.map((sub) =>
      sub.id === subtaskId
        ? { ...sub, status: newStatus }
        : sub.subtasks
        ? {
            ...sub,
            subtasks: findAndMapSubtasks(
              sub.subtasks,
              subtaskId,
              newStatus
            ),
          }
        : sub
    );

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
      } catch {
        alert("Server error during subtask update.");
      }
    },
    [tasks]
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForModal?._id) return;

    const filterEmptySubs = (subs: Subtask[]): Subtask[] =>
      subs.filter((s) => {
        if (s.title.trim() === "") return false;
        if (s.subtasks) s.subtasks = filterEmptySubs(s.subtasks);
        return true;
      });

    const validSubs = filterEmptySubs(subtasks);

    const updatedTask = {
      ...draftTask,
      subtasks: validSubs,
      projectId: currentProjectPrefix,
      taskTimeSpent: (draftTask as any).taskTimeSpent,
      taskStoryPoints: (draftTask as any).taskStoryPoints,
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
    } catch {
      alert("Server error during update.");
    }
  };

  const handleStartSprint = async (taskId: string) => {
    if (!window.confirm("Start sprint?")) return;

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
    } catch {
      alert("Server error during sprint start.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete task?")) return;

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
    } catch {
      alert("Server error during deletion.");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-700 font-medium">Loading tasks...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
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
      <div className="flex-1 min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-white pt-24">
        {/* ---------- NAVBAR WITH VIEW SELECTOR ---------- */}
        <nav className="fixed top-30 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 flex items-center space-x-6 z-20 border border-gray-200">
          <button
            onClick={() => setViewType("card")}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewType === "card"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
            }`}
            title="Card View"
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
            title="Board View"
          >
            <ListTodo className="w-6 h-6" />
          </button>

          <button
            onClick={() => setViewType("chart")}
            className={`p-3 rounded-xl transition-all duration-200 ${
              viewType === "chart"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
            }`}
            title="Chart View"
          >
            <BarChart2 className="w-6 h-6" />
          </button>
        </nav>

        <div className="max-w-[1800px] mx-auto bg-white">
          <>
            <TaskTableHeader
              uniqueProjects={uniqueProjects}
              employees={techEmployees}
              downloadFilterType={downloadFilterType}
              setDownloadFilterType={setDownloadFilterType}
              downloadFilterValue={downloadFilterValue}
              setDownloadFilterValue={setDownloadFilterValue}
              xlsxLoaded={xlsxLoaded}
              handleExcelDownload={() => {}}
            />

            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    No Tech / IT Admin tasks found
                  </h3>
                  <p className="text-slate-500">
                    Try adjusting filters or check if those departments are
                    set correctly on tasks.
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
                subtasks={subtasks}
                employees={techEmployees}
                currentProjectPrefix={currentProjectPrefix}
                allTaskStatuses={allTaskStatuses}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleUpdate={handleUpdate}
                cancelEdit={cancelEdit}
                handleDraftChange={handleDraftChange}
                handleSubtaskChange={handleSubtaskChange}
                // For root-level add:
                addSubtask={() => addSubtask([])}
                removeSubtask={removeSubtask}
                onToggleEdit={handleToggleEdit}
                onToggleExpansion={handleToggleExpansion}
                handleStartSprint={handleStartSprint}
                onTaskStatusChange={onTaskStatusChange}
                onSubtaskStatusChange={onSubtaskStatusChange}
              />
            )}
          </>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
