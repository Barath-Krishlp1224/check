"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";

import TaskTableHeader from "./components/TaskTableHeader";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";

/* ----------------------------- Interfaces (EXPORTED for sub-components) ----------------------------- */
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
  status: string;
  remarks?: string;
  subtasks?: Subtask[];
}

export interface Employee {
  _id: string;
  name: string;
}

/* ----------------------------- Component ----------------------------- */
const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  /* ------------------ API URL BUILDER ------------------ */
  const getApiUrl = (path: string): string => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return `${base}${path}`;
  };

  /* ---------------------------- FETCH FUNCTIONS ---------------------------- */
  const fetchTasks = async () => {
    try {
      const url = getApiUrl("/api/tasks");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setTasks(data.tasks);
      else setError(data.error || "Failed to fetch tasks.");
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Server connection error while fetching tasks.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const url = getApiUrl("/api/employees");
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) setEmployees(data.employees);
      else console.error("Failed to fetch employees:", data.error);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  /* ---------------------------- EFFECT HOOK ---------------------------- */
  useEffect(() => {
    import('xlsx').then(XLSX => {
        (window as any).XLSX = XLSX;
        setXlsxLoaded(true);
    }).catch(err => {
        console.error("Failed to load XLSX library:", err);
    });

    const init = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTasks(), fetchEmployees()]);
      setLoading(false);
    };
    init();
  }, []);

  /* --------------------------- UTILITY: UNIQUE PROJECTS --------------------------- */
  const uniqueProjects = useMemo(() => {
    const projectNames = tasks.map(task => task.project).filter(Boolean);
    return Array.from(new Set(projectNames));
  }, [tasks]);
  
  /* --------------------------- DYNAMIC FILTERED TASKS (For Display) --------------------------- */
  const filteredTasks = useMemo(() => {
    const filter = downloadFilterType;
    const value = downloadFilterValue.trim().toLowerCase();

    if (filter === "all" || !value) {
      return tasks;
    }

    return tasks.filter(task => {
      switch (filter) {
        case "project":
          return task.project.toLowerCase() === value;
          
        case "assignee":
          if (value === "all") return true; 
          return task.assigneeName.toLowerCase() === value;

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
  }, [tasks, downloadFilterType, downloadFilterValue]);

  /* --------------------------- MODAL/UTILITY HANDLERS --------------------------- */
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
  
  /* --------------------------- EDIT/DRAFT HANDLERS (Used by TaskModal) --------------------------- */
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

  /* ---------------------------- SUBTASK HANDLERS ---------------------------- */
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

  /* ---------------------------- CRUD HANDLERS ---------------------------- */
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
      console.error("Update error:", err);
      alert("A server error occurred during update.");
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
      console.error("Delete error:", err);
      alert("Server error during deletion.");
    }
  };

  /* -------------------------- EXCEL DOWNLOAD HANDLER -------------------------- */
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
        tasksForExport = tasks.filter(task => {
            switch (filter) {
                case "project":
                    return task.project === value;
                    
                case "assignee":
                    if (value.toLowerCase() === "all") return true; 
                    return task.assigneeName.toLowerCase() === value.toLowerCase();

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
          alert(`No tasks found for the current filter: ${filter} = ${value || "N/A"}`);
          return;
      }
  
      const dataForExport = tasksForExport.flatMap(task => {
          const mainRow = {
              'Task ID': task.projectId,
              'Item Type': 'Task',
              'Project Name': task.project,
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
              'Project Name': `— ${task.project}`, 
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
  
      const XLSX = (window as any).XLSX;
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      
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
  
      ws['!cols'] = wscols; 
  
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");
  
      const safeValue = value.replace(/[^a-z0-9]/gi, '_');
      const fileName = filter === "all" ? "All_Tasks_Report.xlsx" : `${filter}_${safeValue}_Tasks_Report.xlsx`;
  
      XLSX.writeFile(wb, fileName);
      alert(`✅ Task report downloaded as ${fileName}`);
  };
  /* -------------------------- END DOWNLOAD HANDLER -------------------------- */


  /* ---------------------------- RENDER ---------------------------- */
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Loading tasks and employees...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
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
    <div className="min-h-screen mt-[5%] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        
        {/* Header and Download Controls */}
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
        
        {/* Task Cards Grid (3 in a row layout) */}
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

        {/* Task Modal (Popup) */}
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
            />
        )}
        
      </div>
    </div>
  );
};

export default TasksPage;