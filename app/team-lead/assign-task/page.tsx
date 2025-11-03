// "use client";

// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   ChevronRight, Edit2, Trash2, Save, X, Plus, CheckCircle2, 
//   Clock, Pause, AlertCircle, Download 
// } from "lucide-react";

// /* ----------------------------- Interfaces ----------------------------- */
// interface Subtask {
//   id?: string;
//   title: string;
//   assigneeName?: string;
//   status: string;
//   completion: number;
//   remarks?: string;
// }

// interface Task {
//   _id: string;
//   projectId: string;
//   project: string;
//   assigneeName: string;
//   startDate: string;
//   endDate?: string;
//   dueDate: string;
//   completion: number;
//   status: string;
//   remarks?: string;
//   subtasks?: Subtask[];
// }

// interface Employee {
//   _id: string;
//   name: string;
// }

// /* ----------------------------- Component ----------------------------- */
// const TasksPage: React.FC = () => {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [editRowId, setEditRowId] = useState<string | null>(null);
//   const [draftTask, setDraftTask] = useState<Partial<Task>>({});
//   const [subtasks, setSubtasks] = useState<Subtask[]>([]);
//   const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
//   const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

//   // ⬇️ STATE FOR DOWNLOAD FILTERS & XLSX LOADING ⬇️
//   const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
//   const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
//   const [xlsxLoaded, setXlsxLoaded] = useState(false);
//   // ⬆️ END NEW STATE ⬆️

//   /* ------------------ ✅ DEPLOYMENT-SAFE API URL BUILDER ------------------ */
//   const getApiUrl = (path: string): string => {
//     if (typeof window !== "undefined") {
//       return `${window.location.origin}${path}`;
//     }
//     const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
//     return `${base}${path}`;
//   };

//   /* ---------------------------- FETCH FUNCTIONS ---------------------------- */
//   const fetchTasks = async () => {
//     try {
//       const url = getApiUrl("/api/tasks");
//       console.log("📡 Fetching tasks from:", url);
//       const res = await fetch(url);
//       const data = await res.json();
//       if (res.ok && data.success) setTasks(data.tasks);
//       else setError(data.error || "Failed to fetch tasks.");
//     } catch (err) {
//       console.error("Error fetching tasks:", err);
//       setError("Server connection error while fetching tasks.");
//     }
//   };

//   const fetchEmployees = async () => {
//     try {
//       const url = getApiUrl("/api/employees");
//       console.log("📡 Fetching employees from:", url);
//       const res = await fetch(url);
//       const data = await res.json();
//       if (res.ok && data.success) setEmployees(data.employees);
//       else console.error("Failed to fetch employees:", data.error);
//     } catch (err) {
//       console.error("Error fetching employees:", err);
//     }
//   };

//   /* ---------------------------- EFFECT HOOK ---------------------------- */
//   useEffect(() => {
//     // Dynamically import SheetJS (xlsx) for download functionality
//     import('xlsx').then(XLSX => {
//         // Make the XLSX object globally available for the download handler
//         (window as any).XLSX = XLSX;
//         setXlsxLoaded(true);
//     }).catch(err => {
//         console.error("Failed to load XLSX library:", err);
//         // Do not block the app, but log the error
//     });

//     const init = async () => {
//       setLoading(true);
//       setError("");
//       await Promise.all([fetchTasks(), fetchEmployees()]);
//       setLoading(false);
//     };
//     init();
//   }, []);

//   /* --------------------------- UTILITY: UNIQUE PROJECTS --------------------------- */
//   // Memoize unique project names for the dropdown
//   const uniqueProjects = useMemo(() => {
//     const projectNames = tasks.map(task => task.project).filter(Boolean);
//     return Array.from(new Set(projectNames));
//   }, [tasks]);


//   /* --------------------------- UTILITY HANDLERS --------------------------- */
//   const toggleSubtasks = (taskId: string) => {
//     setExpandedTasks((prev) =>
//       prev.includes(taskId)
//         ? prev.filter((id) => id !== taskId)
//         : [...prev, taskId]
//     );
//   };

//   const generateNextSubtaskId = (prefix: string, currentSubtasks: Subtask[]) => {
//     const numbers = currentSubtasks.map((sub) => {
//       if (sub.id && sub.id.startsWith(`${prefix}-`)) {
//         const numPart = sub.id.split("-").pop();
//         return parseInt(numPart!) || 0;
//       }
//       return 0;
//     });
//     const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
//     const nextNum = (maxNum + 1).toString().padStart(3, "0");
//     return `${prefix}-${nextNum}`;
//   };

//   /* --------------------------- CRUD HANDLERS (EXCEPT UPDATE) --------------------------- */
//   const handleDelete = async (id: string) => {
//     if (!window.confirm("Are you sure you want to delete this task?")) return;
//     try {
//       const url = getApiUrl(`/api/tasks/${id}`);
//       const res = await fetch(url, { method: "DELETE" });
//       const data = await res.json();
//       if (res.ok) {
//         alert("✅ Task deleted successfully!");
//         fetchTasks();
//       } else alert(data.error || "Failed to delete task.");
//     } catch (err) {
//       console.error("Delete error:", err);
//       alert("Server error during deletion.");
//     }
//   };

//   const handleEdit = (task: Task) => {
//     setEditRowId(task._id);
//     setDraftTask(task);
//     setCurrentProjectPrefix(task.projectId);

//     const subtasksWithIDs: Subtask[] = (task.subtasks || []).map((sub, index, arr) => {
//       if (!sub.id || !sub.id.startsWith(task.projectId)) {
//         const tempId = generateNextSubtaskId(task.projectId, arr.slice(0, index));
//         return { ...sub, id: tempId };
//       }
//       return sub;
//     });
//     setSubtasks(subtasksWithIDs);
//   };

//   const handleDraftChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setDraftTask((prev) => ({
//       ...prev,
//       [name]: name === "completion" ? Number(value) : value,
//     }));
//   };

//   /* ---------------------------- SUBTASK HANDLERS ---------------------------- */
//   const handleSubtaskChange = (
//     index: number,
//     field: keyof Subtask,
//     value: string | number
//   ) => {
//     const updated = [...subtasks];
//     (updated[index] as any)[field] =
//       field === "completion" ? Number(value) : value;
//     setSubtasks(updated);
//   };

//   const addSubtask = () => {
//     const newId = generateNextSubtaskId(currentProjectPrefix, subtasks);
//     setSubtasks([
//       ...subtasks,
//       {
//         id: newId,
//         title: "",
//         assigneeName: "",
//         status: "Pending",
//         completion: 0,
//         remarks: "",
//       },
//     ]);
//   };

//   const removeSubtask = (index: number) => {
//     setSubtasks(subtasks.filter((_, i) => i !== index));
//   };

//   /* ---------------------------- UPDATE ---------------------------- */
//   const handleUpdate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editRowId) return;

//     const subtasksToSave = subtasks.filter((s) => s.title.trim() !== "");
//     const updatedTask = {
//       ...draftTask,
//       subtasks: subtasksToSave,
//       projectId: currentProjectPrefix,
//     };

//     try {
//       const url = getApiUrl(`/api/tasks/${editRowId}`);
//       const res = await fetch(url, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(updatedTask),
//       });
//       const data = await res.json();
//       if (res.ok && data.success) {
//         alert("✅ Task updated successfully!");
//         setEditRowId(null);
//         setDraftTask({});
//         setSubtasks([]);
//         setCurrentProjectPrefix("");
//         fetchTasks();
//       } else {
//         alert(`❌ Failed to update task: ${data.error || "Unknown error"}`);
//       }
//     } catch (err) {
//       console.error("Update error:", err);
//       alert("A server error occurred during update.");
//     }
//   };

//   const cancelEdit = () => {
//     setEditRowId(null);
//     setDraftTask({});
//     setSubtasks([]);
//     setCurrentProjectPrefix("");
//   };

//   /* -------------------------- UTILITY: STATUS BADGE -------------------------- */
//   const getStatusBadge = (status: string, isSubtask: boolean = false) => {
//     const baseClasses = "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full";
//     let colorClasses = "";
//     let icon = null;

//     if (status === "Completed") {
//       colorClasses = isSubtask ? "bg-emerald-100 text-emerald-800" : "bg-emerald-50 text-emerald-700 border border-emerald-200";
//       icon = <CheckCircle2 className="w-3 h-3" />;
//     } else if (status === "In Progress") {
//       colorClasses = isSubtask ? "bg-blue-100 text-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200";
//       icon = <Clock className="w-3 h-3" />;
//     } else if (status === "On Hold" || status === "Paused" || status === "Pending") {
//       colorClasses = isSubtask ? "bg-amber-100 text-amber-800" : "bg-amber-50 text-amber-700 border border-amber-200";
//       icon = <Pause className="w-3 h-3" />;
//     } else {
//       colorClasses = isSubtask ? "bg-gray-100 text-gray-800" : "bg-gray-50 text-gray-700 border border-gray-200";
//       icon = <AlertCircle className="w-3 h-3" />;
//     }

//     return (
//       <span className={`${baseClasses} ${colorClasses}`}>
//         {icon}
//         {status}
//       </span>
//     );
//   };

//   /* -------------------------- ⬇️ EXCEL DOWNLOAD HANDLER ⬇️ -------------------------- */
//   const handleExcelDownload = () => {
//     if (typeof window === "undefined" || !(window as any).XLSX) {
//       alert("❌ XLSX library not loaded. Please ensure SheetJS is installed.");
//       return;
//     }

//     let filteredTasks: Task[] = [];
//     const filter = downloadFilterType;
//     const value = downloadFilterValue.trim();

//     // 1. Apply Filtering Logic
//     if (filter === "all") {
//       filteredTasks = tasks;
//     } else if (filter === "project" && value) {
//       // Filter by exact project name match (since it's now a dropdown)
//       filteredTasks = tasks.filter(task => task.project === value);
//     } else if (filter === "assignee" && value) {
//         if (value.toLowerCase() === "all") {
//             filteredTasks = tasks; 
//         } else {
//             filteredTasks = tasks.filter(task => task.assigneeName.toLowerCase() === value.toLowerCase());
//         }
//     } else if (filter === "date" && value) { 
//       filteredTasks = tasks.filter(task => 
//         task.startDate === value || 
//         task.dueDate === value || 
//         task.endDate === value
//       );
//     } else if (filter === "month" && value) { 
//         filteredTasks = tasks.filter(task => 
//             task.startDate.startsWith(value) || 
//             task.dueDate.startsWith(value) || 
//             (task.endDate && task.endDate.startsWith(value))
//         );
//     } else {
//       filteredTasks = tasks;
//     }

//     if (filteredTasks.length === 0) {
//         alert(`No tasks found for the current filter: ${filter} = ${value || "N/A"}`);
//         return;
//     }

//     // 2. Map and Flatten Data for Spreadsheet (NESTING LOGIC)
//     const dataForExport = filteredTasks.flatMap(task => {
//         // Main Task Row Structure
//         const mainRow = {
//             'Task ID': task.projectId,
//             'Item Type': 'Task',
//             'Project Name': task.project,
//             'Main Assignee': task.assigneeName,
//             'Start Date': task.startDate,
//             'End Date': task.endDate || 'N/A',
//             'Due Date': task.dueDate,
//             'Task Progress (%)': task.completion,
//             'Task Status': task.status,
//             'Task Remarks': task.remarks || '-',
//             // Subtask-specific fields start here (N/A for main tasks)
//             'Subtask ID': 'N/A', 
//             'Subtask Title': 'N/A',
//             'Subtask Assignee': 'N/A',
//             'Subtask Progress (%)': 'N/A',
//             'Subtask Status': 'N/A',
//             'Subtask Remarks': 'N/A',
//         };

//         if (!task.subtasks || task.subtasks.length === 0) {
//             return [mainRow];
//         }

//         // Subtask rows: Parent fields are empty for visual grouping
//         const subtaskRows = task.subtasks.map(sub => ({
//             'Task ID': '', 
//             'Item Type': 'Subtask',
//             'Project Name': `— ${task.project}`, // Use marker for nesting
//             'Main Assignee': '', 
//             'Start Date': '', 
//             'End Date': '', 
//             'Due Date': '', 
//             'Task Progress (%)': '', 
//             'Task Status': '', 
//             'Task Remarks': '', 
//             // Subtask-specific fields (Full data here)
//             'Subtask ID': sub.id || 'N/A',
//             'Subtask Title': sub.title,
//             'Subtask Assignee': sub.assigneeName || 'Unassigned',
//             'Subtask Progress (%)': sub.completion,
//             'Subtask Status': sub.status,
//             'Subtask Remarks': sub.remarks || '-',
//         }));

//         return [mainRow, ...subtaskRows];
//     });


//     // 3. Create, Calculate Widths, and Download Excel File (AUTO-SIZING)
//     const XLSX = (window as any).XLSX;
//     const ws = XLSX.utils.json_to_sheet(dataForExport);
    
//     // --- Column Width Auto-Sizing Logic ---
//     const objectKeys = Object.keys(dataForExport[0] || {}); 
//     const wscols = objectKeys.map(key => {
//         let max_width = key.length; 

//         dataForExport.forEach(row => {
//             const cellValue = String((row as any)[key] || '');
//             max_width = Math.max(max_width, cellValue.length);
//         });

//         const finalWidth = Math.min(max_width + 2, 60); 

//         return { wch: finalWidth };
//     });

//     ws['!cols'] = wscols; // Apply the calculated widths

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Tasks Report");

//     // Generate a file name based on the filter
//     const safeValue = value.replace(/[^a-z0-9]/gi, '_');
//     const fileName = filter === "all" ? "All_Tasks_Report.xlsx" : `${filter}_${safeValue}_Tasks_Report.xlsx`;

//     XLSX.writeFile(wb, fileName);
//     alert(`✅ Task report downloaded as ${fileName}`);
//   };
//   /* -------------------------- ⬆️ END DOWNLOAD HANDLER ⬆️ -------------------------- */


//   /* ---------------------------- RENDER ---------------------------- */
//   if (loading)
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
//           <p className="text-slate-600 font-medium">Loading tasks and employees...</p>
//         </div>
//       </div>
//     );

//   if (error)
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
//         <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border border-red-200">
//           <div className="flex items-center gap-3 mb-4">
//             <div className="p-2 bg-red-100 rounded-full">
//               <AlertCircle className="w-6 h-6 text-red-600" />
//             </div>
//             <h3 className="text-xl font-bold text-gray-900">Error</h3>
//           </div>
//           <p className="text-red-600">{error}</p>
//         </div>
//       </div>
//     );

//   const hasSubtasks = (task: Task) => task.subtasks && task.subtasks.length > 0;

//   return (
//     <div className="min-h-screen mt-[5%] py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-[1800px] mx-auto">
//         {/* Header and Download Controls */}
//         <div className="mb-8">
//           <div className="flex items-end justify-between">
//             <div>
//               <h1 className="text-4xl font-bold text-white mb-2">Project Tasks</h1>
//             </div>

//             <div className="flex items-center gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
//               {/* Filter Type Selector */}
//               <select
//                 value={downloadFilterType}
//                 onChange={(e) => {
//                   setDownloadFilterType(e.target.value);
//                   setDownloadFilterValue(""); // Reset value when type changes
//                 }}
//                 className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-700 font-medium bg-slate-50"
//               >
//                 <option value="all">All Tasks (Default)</option>
//                 <option value="project">By Project Name</option>
//                 <option value="assignee">By Assignee</option>
//                 <option value="date">By Single Date</option>
//                 <option value="month">By Month (YYYY-MM)</option>
//               </select>

//               {/* Filter Value Input/Select */}
//               {downloadFilterType === "project" && (
//                 <select
//                   value={downloadFilterValue}
//                   onChange={(e) => setDownloadFilterValue(e.target.value)}
//                   className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
//                 >
//                   <option value="">Select Project</option>
//                   {uniqueProjects.sort().map((project) => (
//                     <option key={project} value={project}>
//                       {project}
//                     </option>
//                   ))}
//                 </select>
//               )}
//               {downloadFilterType === "date" && (
//                 <input
//                   type="date"
//                   value={downloadFilterValue}
//                   onChange={(e) => setDownloadFilterValue(e.target.value)}
//                   className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
//                 />
//               )}
//               {downloadFilterType === "month" && (
//                 <input
//                   type="month"
//                   value={downloadFilterValue}
//                   onChange={(e) => setDownloadFilterValue(e.target.value)}
//                   className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
//                 />
//               )}
//               {downloadFilterType === "assignee" && (
//                 <select
//                   value={downloadFilterValue}
//                   onChange={(e) => setDownloadFilterValue(e.target.value)}
//                   className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
//                 >
//                   <option value="">Select Employee</option>
//                   <option value="all">All Employees</option>
//                   {employees.map(employee => (
//                     <option key={employee._id} value={employee.name}>{employee.name}</option>
//                   ))}
//                 </select>
//               )}

//               {/* Download Button */}
//               <button
//                 onClick={handleExcelDownload}
//                 className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-md ${
//                     (!xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue)) 
//                         ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
//                         : 'bg-green-600 text-white hover:bg-green-700'
//                 }`}
//                 disabled={!xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue)}
//               >
//                 <Download className="w-4 h-4" />
//                 Export to Excel
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Table Container */}
//         <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-slate-200">
//               <thead>
//                 <tr className="bg-gradient-to-r from-slate-800 to-slate-700">
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-12"></th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">ID</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Type</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Project</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Assignee</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Start</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">End</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Due</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Progress</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Status</th>
//                   <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Remarks</th>
//                   <th className="px-4 py-4 text-right text-xs font-bold text-white uppercase tracking-wider w-[14%]">Actions</th>
//                 </tr>
//               </thead>

//               <tbody className="bg-white divide-y divide-slate-100">
//                 {tasks.map((task, idx) => {
//                   const isEditing = task._id === editRowId;
//                   const isExpanded = expandedTasks.includes(task._id);
//                   const current = isEditing ? draftTask : task;

//                   return (
//                     <React.Fragment key={task._id}>
//                       {/* MAIN TASK ROW */}
//                       <tr className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50`}>
//                         {/* Toggle Button */}
//                         <td className="px-4 py-4">
//                           {hasSubtasks(task) && (
//                             <button 
//                               onClick={() => toggleSubtasks(task._id)}
//                               className="p-1 rounded-lg hover:bg-indigo-100 transition-all duration-200"
//                             >
//                               <ChevronRight className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
//                             </button>
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm font-semibold text-indigo-600">{task.projectId}</td>
//                         <td className="px-4 py-4">
//                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
//                             Task
//                           </span>
//                         </td>
//                         <td className="px-4 py-4 text-sm font-medium text-gray-900">
//                           {isEditing ? (
//                             <input 
//                               name="project" 
//                               value={current.project || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black" 
//                             />
//                           ) : (
//                             task.project
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm text-gray-900">
//                           {isEditing ? (
//                             <select 
//                               name="assigneeName" 
//                               value={current.assigneeName || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
//                             >
//                               <option value="">Select Assignee</option>
//                               {employees.map(employee => (
//                                 <option key={employee._id} value={employee.name}>{employee.name}</option>
//                               ))}
//                             </select>
//                           ) : (
//                             <span className="font-medium">{task.assigneeName}</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm text-gray-900">
//                           {isEditing ? (
//                             <input 
//                               type="date" 
//                               name="startDate" 
//                               value={current.startDate || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black" 
//                             />
//                           ) : (
//                             task.startDate
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm text-gray-900">
//                           {isEditing ? (
//                             <input 
//                               type="date" 
//                               name="endDate" 
//                               value={current.endDate || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black" 
//                             />
//                           ) : (
//                             task.endDate || <span className="text-gray-500">N/A</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm text-gray-900">
//                           {isEditing ? (
//                             <input 
//                               type="date" 
//                               name="dueDate" 
//                               value={current.dueDate || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black" 
//                             />
//                           ) : (
//                             task.dueDate
//                           )}
//                         </td>
//                         <td className="px-4 py-4">
//                           {isEditing ? (
//                             <input
//                               type="number"
//                               name="completion"
//                               value={current.completion || 0}
//                               onChange={handleDraftChange}
//                               min={0}
//                               max={100}
//                               className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
//                             />
//                           ) : (
//                             <div className="flex items-center gap-2">
//                               <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
//                                 <div 
//                                   className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
//                                   style={{ width: `${task.completion}%` }}
//                                 ></div>
//                               </div>
//                               <span className="text-xs font-semibold text-gray-900 min-w-[3rem]">{task.completion}%</span>
//                             </div>
//                           )}
//                         </td>
//                         <td className="px-4 py-4">
//                           {isEditing ? (
//                             <select 
//                               name="status" 
//                               value={current.status || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black"
//                             >
//                               <option>In Progress</option>
//                               <option>Completed</option>
//                               <option>On Hold</option>
//                               <option>Paused</option>
//                             </select>
//                           ) : (
//                             getStatusBadge(task.status)
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-sm text-black max-w-[200px] whitespace-normal">
//                           {isEditing ? (
//                             <input 
//                               name="remarks" 
//                               value={current.remarks || ""} 
//                               onChange={handleDraftChange} 
//                               className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-black" 
//                             />
//                           ) : (
//                             <div className="max-h-12 overflow-y-auto text-gray-700 p-1 -m-1 custom-scrollbar">
//                                 {task.remarks || "-"}
//                             </div>
//                           )}
//                         </td>
//                         <td className="px-4 py-4 text-right">
//                           {isEditing ? (
//                             <div className="flex justify-end gap-2">
//                               <button 
//                                 onClick={handleUpdate} 
//                                 className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
//                               >
//                                 <Save className="w-4 h-4" />
//                                 Save
//                               </button>
//                               <button 
//                                 onClick={cancelEdit} 
//                                 className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
//                               >
//                                 <X className="w-4 h-4" />
//                                 Cancel
//                               </button>
//                             </div>
//                           ) : (
//                             <div className="flex justify-end gap-2">
//                               <button 
//                                 onClick={() => handleEdit(task)} 
//                                 className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
//                               >
//                                 <Edit2 className="w-4 h-4" />
//                                 Edit
//                               </button>
//                               <button 
//                                 onClick={() => handleDelete(task._id)} 
//                                 className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
//                               >
//                                 <Trash2 className="w-4 h-4" />
//                                 Delete
//                               </button>
//                             </div>
//                           )}
//                         </td>
//                       </tr>

//                       {/* SUBTASK VIEWER */}
//                       {isExpanded && !isEditing && hasSubtasks(task) && (
//                         <tr className="bg-slate-50">
//                           <td colSpan={12} className="px-8 py-6">
//                             <div className="ml-6 border-l-4 border-indigo-500 pl-6">
//                               <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
//                                 <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
//                                 Subtasks for {task.project}
//                               </h4>
//                               <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
//                                 <table className="w-full text-sm">
//                                   <thead className="bg-slate-100 border-b border-slate-200">
//                                     <tr>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Sub ID</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Type</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Title</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Assignee</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Progress</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Remarks</th>
//                                     </tr>
//                                   </thead>
//                                   <tbody className="divide-y divide-slate-100">
//                                     {task.subtasks!.map((subtask, i) => (
//                                       <tr key={i} className="hover:bg-slate-50 transition-colors">
//                                         <td className="px-4 py-3 text-sm font-semibold text-purple-600">{subtask.id || "N/A"}</td>
//                                         <td className="px-4 py-3">
//                                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
//                                             Subtask
//                                           </span>
//                                         </td>
//                                         <td className="px-4 py-3 text-sm font-medium text-gray-900">{subtask.title}</td>
//                                         <td className="px-4 py-3 text-sm text-gray-900">{subtask.assigneeName || <span className="text-gray-500">Unassigned</span>}</td>
//                                         <td className="px-4 py-3">
//                                           <div className="flex items-center gap-2">
//                                             <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden max-w-[80px]">
//                                               <div 
//                                                 className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
//                                                 style={{ width: `${subtask.completion}%` }}
//                                               ></div>
//                                             </div>
//                                             <span className="text-xs font-semibold text-gray-900">{subtask.completion}%</span>
//                                           </div>
//                                         </td>
//                                         <td className="px-4 py-3">{getStatusBadge(subtask.status, true)}</td>
//                                         <td className="px-4 py-3 text-sm text-gray-700">{subtask.remarks || '-'}</td>
//                                       </tr>
//                                     ))}
//                                   </tbody>
//                                 </table>
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       )}

//                       {/* SUBTASK EDITOR */}
//                       {isEditing && (
//                         <tr className="bg-slate-50">
//                           <td colSpan={12} className="px-8 py-6">
//                             <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
//                               <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
//                                 <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>
//                                 Subtasks (Edit Mode)
//                               </h4>
//                               <div className="overflow-hidden rounded-lg border border-slate-200">
//                                 <table className="w-full text-sm">
//                                   <thead className="bg-gradient-to-r from-slate-700 to-slate-600">
//                                     <tr>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">ID</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Title</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Assignee</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Status</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Progress</th>
//                                       <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">Remarks</th>
//                                       <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">Actions</th>
//                                     </tr>
//                                   </thead>
//                                   <tbody className="divide-y divide-slate-100">
//                                     {subtasks.map((sub, i) => (
//                                       <tr key={i} className="bg-white">
//                                         <td className="px-4 py-3 text-center font-semibold text-purple-600 bg-slate-50">{sub.id || "New"}</td>
//                                         <td className="px-4 py-3">
//                                           <input
//                                             value={sub.title}
//                                             onChange={(e) => handleSubtaskChange(i, "title", e.target.value)}
//                                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
//                                             placeholder="Subtask Title"
//                                           />
//                                         </td>
//                                         <td className="px-4 py-3">
//                                           <select
//                                             value={sub.assigneeName || ""}
//                                             onChange={(e) => handleSubtaskChange(i, "assigneeName", e.target.value)}
//                                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
//                                           >
//                                             <option value="" className="text-gray-500">Select Assignee</option>
//                                             {employees.map(employee => (
//                                               <option key={employee._id} value={employee.name}>{employee.name}</option>
//                                             ))}
//                                           </select>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                           <select
//                                             value={sub.status}
//                                             onChange={(e) => handleSubtaskChange(i, "status", e.target.value)}
//                                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
//                                           >
//                                             <option>Pending</option>
//                                             <option>In Progress</option>
//                                             <option>Completed</option>
//                                           </select>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                           <input
//                                             type="number"
//                                             value={sub.completion}
//                                             onChange={(e) => handleSubtaskChange(i, "completion", Number(e.target.value))}
//                                             className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
//                                             placeholder="0-100"
//                                             min={0}
//                                             max={100}
//                                           />
//                                         </td>
//                                         <td className="px-4 py-3">
//                                           <input
//                                             value={sub.remarks || ""}
//                                             onChange={(e) => handleSubtaskChange(i, "remarks", e.target.value)}
//                                             className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
//                                             placeholder="Add remarks"
//                                           />
//                                         </td>
//                                         <td className="px-4 py-3 text-center">
//                                           <button 
//                                             onClick={() => removeSubtask(i)} 
//                                             className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
//                                           >
//                                             <Trash2 className="w-3 h-3" />
//                                             Remove
//                                           </button>
//                                         </td>
//                                       </tr>
//                                     ))}
//                                   </tbody>
//                                 </table>
//                               </div>
//                               <div className="mt-4 flex items-center gap-3">
//                                 <button 
//                                   onClick={addSubtask} 
//                                   className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm ${
//                                     currentProjectPrefix 
//                                       ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
//                                       : 'bg-slate-300 text-slate-500 cursor-not-allowed'
//                                   }`}
//                                   disabled={!currentProjectPrefix}
//                                 >
//                                   <Plus className="w-4 h-4" />
//                                   Add Subtask
//                                 </button>
//                                 {!currentProjectPrefix && (
//                                   <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
//                                     <AlertCircle className="w-4 h-4" />
//                                     <span className="text-xs font-medium">Cannot add subtask: Project ID is missing</span>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {tasks.length === 0 && !loading && (
//           <div className="text-center py-16">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
//               <AlertCircle className="w-8 h-8 text-slate-400" />
//             </div>
//             <h3 className="text-xl font-semibold text-slate-700 mb-2">No tasks found</h3>
//             <p className="text-slate-500">Start by creating your first task</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TasksPage;


// app/team-lead/assign-task/page.tsx (Updated)
// app/team-lead/assign-task/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AlertCircle } from "lucide-react";

// Import the new components
import TaskTableHeader from "./components/TaskTableHeader";
import TaskTable from "./components/TaskTable";

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
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState<Partial<Task>>({});
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [currentProjectPrefix, setCurrentProjectPrefix] = useState<string>("");

  // STATE FOR DOWNLOAD FILTERS & XLSX LOADING (Also used for display filtering)
  const [downloadFilterType, setDownloadFilterType] = useState<string>("all");
  const [downloadFilterValue, setDownloadFilterValue] = useState<string>("");
  const [xlsxLoaded, setXlsxLoaded] = useState(false);

  /* ------------------ ✅ DEPLOYMENT-SAFE API URL BUILDER ------------------ */
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
      console.log("📡 Fetching tasks from:", url);
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
      console.log("📡 Fetching employees from:", url);
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
    // Dynamically import SheetJS (xlsx) for download functionality
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
          // downloadFilterValue uses the exact date string format from the date input
          return (
            task.startDate === downloadFilterValue || 
            task.dueDate === downloadFilterValue || 
            (task.endDate && task.endDate === downloadFilterValue)
          );
        
        case "month":
          // downloadFilterValue uses the YYYY-MM prefix from the month input
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
  /* --------------------------- END DYNAMIC FILTERED TASKS --------------------------- */


  /* --------------------------- UTILITY HANDLERS --------------------------- */
  const toggleSubtasks = (taskId: string) => {
    setExpandedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

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

  /* --------------------------- CRUD HANDLERS --------------------------- */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const url = getApiUrl(`/api/tasks/${id}`);
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Task deleted successfully!");
        fetchTasks();
      } else alert(data.error || "Failed to delete task.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error during deletion.");
    }
  };

  const handleEdit = (task: Task) => {
    setEditRowId(task._id);
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

  /* ---------------------------- UPDATE ---------------------------- */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRowId) return;

    const subtasksToSave = subtasks.filter((s) => s.title.trim() !== "");
    const updatedTask = {
      ...draftTask,
      subtasks: subtasksToSave,
      projectId: currentProjectPrefix,
    };

    try {
      const url = getApiUrl(`/api/tasks/${editRowId}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Task updated successfully!");
        setEditRowId(null);
        setDraftTask({});
        setSubtasks([]);
        setCurrentProjectPrefix("");
        fetchTasks();
      } else {
        alert(`❌ Failed to update task: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("A server error occurred during update.");
    }
  };

  const cancelEdit = () => {
    setEditRowId(null);
    setDraftTask({});
    setSubtasks([]);
    setCurrentProjectPrefix("");
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
  
      // Use the same logic as filteredTasks for consistency, but use 'tasks' (unfiltered list) as the source
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
  
      // 2. Map and Flatten Data for Spreadsheet (NESTING LOGIC)
      const dataForExport = tasksForExport.flatMap(task => {
          // Main Task Row Structure
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
  
          // Subtask rows: Parent fields are empty for visual grouping
          const subtaskRows = task.subtasks.map(sub => ({
              'Task ID': '', 
              'Item Type': 'Subtask',
              'Project Name': `— ${task.project}`, // Use marker for nesting
              'Main Assignee': '', 
              'Start Date': '', 
              'End Date': '', 
              'Due Date': '', 
              'Task Progress (%)': '', 
              'Task Status': '', 
              'Task Remarks': '', 
              // Subtask-specific fields (Full data here)
              'Subtask ID': sub.id || 'N/A',
              'Subtask Title': sub.title,
              'Subtask Assignee': sub.assigneeName || 'Unassigned',
              'Subtask Progress (%)': sub.completion,
              'Subtask Status': sub.status,
              'Subtask Remarks': sub.remarks || '-',
          }));
  
          return [mainRow, ...subtaskRows];
      });
  
  
      // 3. Create, Calculate Widths, and Download Excel File (AUTO-SIZING)
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
  
      ws['!cols'] = wscols; // Apply the calculated widths
  
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

        {/* Task Table - Uses filteredTasks for display */}
        <TaskTable 
          tasks={filteredTasks} 
          employees={employees}
          editRowId={editRowId}
          draftTask={draftTask}
          subtasks={subtasks}
          expandedTasks={expandedTasks}
          currentProjectPrefix={currentProjectPrefix}
          toggleSubtasks={toggleSubtasks}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
          cancelEdit={cancelEdit}
          handleDraftChange={handleDraftChange}
          handleSubtaskChange={handleSubtaskChange}
          addSubtask={addSubtask}
          removeSubtask={removeSubtask}
        />
        
      </div>
    </div>
  );
};

export default TasksPage;