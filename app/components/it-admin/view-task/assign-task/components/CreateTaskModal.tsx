"use client";

import React, { useEffect, useMemo, useState, useCallback, ChangeEvent } from "react";
import {
  Calendar,
  User,
  Target,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Plus, 
} from "lucide-react";

// Assuming these types are available from the main file's imports or nearby
export interface Employee {
  _id: string;
  name: string;
  empId?: string;
  team?: string;
  category?: string;
  department?: string;
  canonicalTeam?: string;
}

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void; // Function to call when a task is successfully created (to refresh list)
  employees: Employee[];
  getApiUrl: (path: string) => string;
  allTaskStatuses: string[];
}

const DEPARTMENT_OPTIONS = [
  "Tech",
  "Accounts",
  "IT Admin",
  "Manager",
  "Admin & Operations",
  "HR",
  "Founders",
  "TL-Reporting Manager",
] as const;

const departmentAliases: Record<string, string[]> = {
  Tech: ["tech", "development", "engineering", "dev", "frontend", "backend"],
  Accounts: ["accounts", "finance", "fin"],
  "IT Admin": ["it admin", "it", "itadmin", "sysadmin", "system admin"],
  Manager: ["manager", "managers"],
  "Admin & Operations": ["admin", "operations", "ops", "admin & operations", "admin operations"],
  HR: ["hr", "human resources", "human-resources"],
  Founders: ["founder", "founders", "leadership"],
  "TL-Reporting Manager": ["tl", "reporting manager", "tl-reporting manager", "tl-reporting"],
};

function normalizeToCanonicalTeam(raw?: string | null): string | null {
  if (!raw) return null;
  const v = raw.toString().trim().toLowerCase();

  for (const canonical of Object.keys(departmentAliases)) {
    const aliases = departmentAliases[canonical];
    if (aliases.some((a) => a === v)) return canonical;
  }

  for (const canonical of Object.keys(departmentAliases)) {
    const aliases = departmentAliases[canonical];
    if (aliases.some((a) => v.includes(a))) return canonical;
  }

  for (const canonical of Object.keys(departmentAliases)) {
    if (v === canonical.toLowerCase()) return canonical;
  }

  return null;
}

const INITIAL_FORM_STATE = {
    assigneeNames: [] as string[],
    projectId: "",
    project: "",
    department: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dueDate: "",
    // Explicitly type completion as string, as it comes from a form input
    completion: "" as string, 
    status: "Backlog",
    remarks: "",
};

// Get the base type from the form state
type BaseFormState = typeof INITIAL_FORM_STATE;

// Create TaskPayload by omitting the string completion and adding the numerical/undefined completion
type TaskPayload = Omit<BaseFormState, 'completion'> & {
  completion: number | undefined;
};


const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ open, onClose, onCreated, employees: rawEmployees, getApiUrl, allTaskStatuses }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize employees once (from the prop)
  const employees = useMemo(() => {
    return rawEmployees.map((e: any) => {
        const teamRaw = (e.team ?? e.department ?? e.departmentName ?? e.department_name ?? "").toString();
        const canonical = normalizeToCanonicalTeam(teamRaw) ?? null;
        return {
            ...e,
            canonicalTeam: canonical ?? undefined,
        } as Employee;
    });
  }, [rawEmployees]);


  // Effect to reset form/message when modal is opened/closed
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM_STATE);
      setMessage("");
    }
  }, [open]);


  const filteredAssignees = useMemo(() => {
    const dept = formData.department?.trim();
    if (!dept || employees.length === 0) return [];

    const canonicalSelected = DEPARTMENT_OPTIONS.find(
      (d) => d.toLowerCase() === dept.toLowerCase()
    ) as string | undefined;

    if (canonicalSelected) {
      const byCanonical = employees.filter(
        (e) => (e.canonicalTeam ?? "").toLowerCase() === canonicalSelected.toLowerCase()
      );
      if (byCanonical.length > 0) return byCanonical;

      return employees.filter((e) => {
        const combined = `${e.team ?? ""} ${e.department ?? ""} ${e.category ?? ""}`.toLowerCase();
        return combined.includes(canonicalSelected.toLowerCase());
      });
    }

    // Fallback if no canonical department found
    return employees.filter((e) => {
      const combined = `${e.team ?? ""} ${e.department ?? ""} ${e.category ?? ""}`.toLowerCase();
      return combined.includes(dept.toLowerCase());
    });
  }, [formData.department, employees]);

  const assigneeDisabled = !formData.department || employees.length === 0;

  // Effect to clear selected assignees if the department changes
  useEffect(() => {
    if (!formData.department) {
      setFormData((s) => ({ ...s, assigneeNames: [] }));
      return;
    }
    
    const canonicalSelected = formData.department.toLowerCase();

    const currentAssigneesValid = formData.assigneeNames.every(name => {
        const selected = employees.find((e) => e.name === name);
        return selected && (selected.canonicalTeam ?? "").toLowerCase() === canonicalSelected;
    });

    if (!currentAssigneesValid) {
        setFormData((s) => ({ ...s, assigneeNames: [] }));
    }

  }, [formData.department, employees]);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox change (for assigneeNames)
    if (name === "assigneeNames" && type === "checkbox") {
        const isChecked = (e.target as HTMLInputElement).checked;
        const assigneeName = value;

        setFormData((s) => {
            const currentNames = s.assigneeNames;
            if (isChecked) {
                // Add the name if checked and not already present
                if (!currentNames.includes(assigneeName)) {
                    return { ...s, assigneeNames: [...currentNames, assigneeName] };
                }
            } else {
                // Remove the name if unchecked
                return { ...s, assigneeNames: currentNames.filter(n => n !== assigneeName) };
            }
            return s; // No change needed
        });
    } else {
        // Handle regular inputs/selects
        setFormData((s) => ({ ...s, [name]: value }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!formData.projectId.trim() || !formData.project.trim()) {
      setMessage("❌ Project ID and Project Name are required.");
      setIsSubmitting(false);
      return;
    }

    if (formData.assigneeNames.length === 0) {
      setMessage("❌ Please select at least one Assignee.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.department.trim()) {
      setMessage("❌ Please select a Department.");
      setIsSubmitting(false);
      return;
    }

    try {
      // The payload structure now correctly assigns the converted completion value
      const finalPayload: TaskPayload = {
        ...formData,
        assigneeNames: formData.assigneeNames,
        completion: formData.completion === "" ? undefined : Number(formData.completion),
      };
      
      // Use getApiUrl from props
      const url = getApiUrl("/api/tasks/add");

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Task submitted successfully! Refreshing task list...");
        setFormData(INITIAL_FORM_STATE); // Reset form
        
        // Use a timeout to show success message briefly before closing and refreshing
        setTimeout(() => {
            onCreated(); // Tell parent to refresh list
            onClose(); // Close modal
        }, 1500);

      } else {
        setMessage(data?.error || "❌ Failed to submit task");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("❌ Server error. Please try again.");
    } finally {
      // Only set submitting to false if we haven't initiated the closing timeout
      if (!message.includes("successfully")) {
        setIsSubmitting(false);
      }
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
      Backlog: "bg-slate-100 text-slate-700 border-slate-200",
      "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
      Paused: "bg-amber-100 text-amber-700 border-amber-200",
      Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "On Hold": "bg-slate-100 text-slate-700 border-slate-200",
      "Dev Review": "bg-purple-100 text-purple-700 border-purple-200",
      "Deployed in QA": "bg-teal-100 text-teal-700 border-teal-200",
      "Test In Progress": "bg-pink-100 text-pink-700 border-pink-200",
      "QA Sign Off": "bg-lime-100 text-lime-700 border-lime-200",
      "Deployment Stage": "bg-cyan-100 text-cyan-700 border-cyan-200",
      "Pilot Test": "bg-orange-100 text-orange-700 border-orange-200",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.Backlog}`}>
        {status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
        {status}
      </span>
    );
  };
  
  // Minimal Modal Structure - use your actual modal component if available
  if (!open) return null;

  return (
    // Removed my-8 from the fixed container to reduce vertical height on large screens
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
  className="relative bg-white rounded-2xl shadow-2xl max-w-7xl mt-20 w-full max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-out"
  onClick={(e) => e.stopPropagation()}
>

        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white rounded-t-2xl sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-600" /> 
                Create New Task
            </h2>
            <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                onClick={onClose}
                title="Close"
                disabled={isSubmitting}
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-8">
            {message && (
            <div
                className={`mb-6 rounded-xl border-l-4 p-4 shadow-sm ${
                message.includes("successfully") ? "bg-emerald-50 border-emerald-500" : "bg-red-50 border-red-500"
                }`}
            >
                <div className="flex items-center gap-3">
                {message.includes("successfully") ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`font-medium text-sm ${message.includes("successfully") ? "text-emerald-800" : "text-red-800"}`}>
                    {message}
                </p>
                </div>
            </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="p-8">
                <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Project Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Project ID *</label>
                    <input
                        type="text"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        placeholder="PROJ-2024-001"
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        disabled={isSubmitting}
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
                    <input
                        type="text"
                        name="project"
                        value={formData.project}
                        onChange={handleChange}
                        placeholder="Enter project name"
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        disabled={isSubmitting}
                    />
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Department *</label>
                    <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        disabled={isSubmitting}
                    >
                        <option value="">Select department</option>
                        {DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                            {d}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-semibold text-slate-900">Assignment</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Assignee(s) *</label>

                        {employees.length === 0 ? (
                            <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
                                <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                Loading employees...
                                </div>
                            </div>
                        ) : assigneeDisabled ? (
                            <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-500 bg-slate-50 opacity-60 cursor-not-allowed">
                                Choose a department first
                            </div>
                        ) : (
                        // Checkbox list
                        <div className={`p-4 border rounded-lg bg-white overflow-y-auto max-h-48 shadow-sm ${assigneeDisabled ? 'opacity-60 cursor-not-allowed border-slate-200' : 'border-slate-300'}`}>
                            {filteredAssignees.length === 0 ? (
                                <p className="text-sm text-slate-500">No assignees found for {formData.department}</p>
                            ) : (
                                filteredAssignees.map((emp) => (
                                    <div key={emp._id} className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            id={`assignee-${emp._id}`}
                                            name="assigneeNames"
                                            value={emp.name}
                                            checked={formData.assigneeNames.includes(emp.name)}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                        <label 
                                            htmlFor={`assignee-${emp._id}`}
                                            className="ml-3 text-sm font-medium text-slate-700 cursor-pointer"
                                        >
                                            {emp.name} {emp.empId ? `• ${emp.empId}` : ""}
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                        )}
                    </div>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-semibold text-slate-900">Timeline</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                        <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                        />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                            <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                            <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                            />
                        </div>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-semibold text-slate-900">Task Progress</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                        >
                            {allTaskStatuses.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="mt-2">
                            <StatusBadge status={formData.status} />
                        </div>
                        </div>

                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Completion Percentage</label>
                        <div className="relative">
                            <input
                            type="number"
                            name="completion"
                            value={formData.completion}
                            onChange={handleChange}
                            placeholder="0"
                            min={0}
                            max={100}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                            disabled={isSubmitting}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">%</span>
                        </div>
                        {formData.completion && (
                            <div className="mt-2 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                                style={{ width: `${Math.min(Number(formData.completion), 100)}%` }}
                            />
                            </div>
                        )}
                        </div>
                    </div>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h3 className="text-base font-semibold text-slate-900">Additional Notes</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Remarks</label>
                        <textarea
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            placeholder="Add any additional comments or context..."
                            rows={4}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm"
                            disabled={isSubmitting}
                        />
                    </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
                <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                disabled={isSubmitting}
                >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-5 h-5" />
                        Create Task
                    </>
                )}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;