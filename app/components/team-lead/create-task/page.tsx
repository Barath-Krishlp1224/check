"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  BarChart3,
  Plus,
} from "lucide-react";

// --- Type Definitions and Utility Functions (Unchanged) ---
interface Employee {
  _id: string;
  name: string;
  empId?: string;
  team?: string;
  category?: string;
  department?: string;
  canonicalTeam?: string;
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
  "TL Accountant",
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
  "TL Accountant": ["tl accountant", "lead accountant", "tl-accounts", "senior accountant"],
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
// --- End Type Definitions and Utility Functions ---

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingByDept, setFetchingByDept] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    assigneeNames: [] as string[],
    projectId: "",
    project: "",
    department: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dueDate: "",
    completion: "",
    status: "Backlog",
    remarks: "",
  });

  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();

        const rawEmployees: any[] = Array.isArray(data?.employees)
          ? data.employees
          : data?.data ?? [];

        const normalized: Employee[] = rawEmployees.map((e: any) => {
          const teamRaw = (
            e.team ??
            e.department ??
            e.departmentName ??
            e.department_name ??
            ""
          ).toString();
          const canonical = normalizeToCanonicalTeam(teamRaw) ?? null;
          return {
            _id: e._id ?? e.id ?? String(Math.random()),
            name: e.name ?? e.fullName ?? e.full_name ?? "Unknown",
            empId: e.empId ?? e.empID ?? e.employeeId ?? "",
            team: teamRaw,
            category: e.category ?? "",
            department: e.department ?? "",
            canonicalTeam: canonical ?? undefined,
          } as Employee;
        });

        setEmployees(normalized);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const filteredAssignees = useMemo(() => {
    const dept = formData.department?.trim();
    if (!dept || employees.length === 0) return [];

    const selectedDeptLower = dept.toLowerCase();
    const canonicalSelected = normalizeToCanonicalTeam(dept);
    const canonicalSelectedLower = canonicalSelected ? canonicalSelected.toLowerCase() : "";

    let matchedEmployees: Employee[] = [];

    if (canonicalSelected) {
      matchedEmployees = employees.filter(
        (e) => (e.canonicalTeam ?? "").toLowerCase() === canonicalSelectedLower
      );

      if (canonicalSelectedLower === "accounts") {
        const tlAccountantEmployees = employees.filter(
          (e) => (e.canonicalTeam ?? "").toLowerCase() === "tl accountant"
        );
        const combined = [...matchedEmployees, ...tlAccountantEmployees];
        const uniqueEmployees = Array.from(new Set(combined.map((e) => e._id)))
          .map((id) => combined.find((e) => e._id === id))
          .filter((e): e is Employee => e !== undefined);

        matchedEmployees = uniqueEmployees;
      }

      if (matchedEmployees.length > 0) return matchedEmployees;
    }

    return employees.filter((e) => {
      const teamLower = (e.team ?? "").toLowerCase();
      const departmentLower = (e.department ?? "").toLowerCase();
      const categoryLower = (e.category ?? "").toLowerCase();

      return (
        teamLower.includes(selectedDeptLower) ||
        departmentLower.includes(selectedDeptLower) ||
        categoryLower.includes(selectedDeptLower)
      );
    });
  }, [formData.department, employees]);

  const assigneeDisabled = !formData.department || loading || fetchingByDept;

  useEffect(() => {
    if (!formData.department) {
      setFormData((s) => ({ ...s, assigneeNames: [] }));
      return;
    }

    const canonicalSelected = normalizeToCanonicalTeam(formData.department) ?? "";
    const canonicalSelectedLower = canonicalSelected.toLowerCase();

    const validCanonicalTeams = new Set([canonicalSelectedLower]);
    if (canonicalSelectedLower === "accounts") {
      validCanonicalTeams.add("tl accountant");
    }

    const currentAssigneesValid = formData.assigneeNames.every((name) => {
      const selected = employees.find((e) => e.name === name);
      return (
        selected && validCanonicalTeams.has((selected.canonicalTeam ?? "").toLowerCase())
      );
    });

    if (!currentAssigneesValid) {
      setFormData((s) => ({ ...s, assigneeNames: [] }));
    }
  }, [formData.department, employees]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "assigneeNames" && type === "checkbox") {
      const isChecked = (e.target as HTMLInputElement).checked;
      const assigneeName = value;

      setFormData((s) => {
        const currentNames = s.assigneeNames;
        if (isChecked) {
          if (!currentNames.includes(assigneeName)) {
            return { ...s, assigneeNames: [...currentNames, assigneeName] };
          }
        } else {
          return {
            ...s,
            assigneeNames: currentNames.filter((n) => n !== assigneeName),
          };
        }
        return s;
      });
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.projectId.trim() || !formData.project.trim()) {
      setMessage("❌ Project ID and Project Name are required.");
      return;
    }

    if (formData.assigneeNames.length === 0) {
      setMessage("❌ Please select at least one Assignee.");
      return;
    }

    if (!formData.department.trim()) {
      setMessage("❌ Please select a Department.");
      return;
    }

    try {
      const payload = {
        ...formData,
        assigneeName: formData.assigneeNames.join(", "),
        assigneeNames: formData.assigneeNames,
        completion:
          formData.completion === "" ? undefined : Number(formData.completion),
      };

      const { assigneeName, ...finalPayload } = payload;

      const res = await fetch("/api/tasks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Task submitted successfully!");
        setFormData({
          assigneeNames: [],
          projectId: "",
          project: "",
          department: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          dueDate: "",
          completion: "",
          status: "Backlog",
          remarks: "",
        });

        try {
          setFetchingByDept(true);
          const refreshRes = await fetch("/api/employees");
          const refreshJson = await refreshRes.json();
          const rawEmployees: any[] = Array.isArray(refreshJson?.employees)
            ? refreshJson.employees
            : refreshJson?.data ?? [];
          const normalized: Employee[] = rawEmployees.map((e: any) => {
            const teamRaw = (
              e.team ??
              e.department ??
              e.departmentName ??
              e.department_name ??
              ""
            ).toString();
            const canonical = normalizeToCanonicalTeam(teamRaw) ?? null;
            return {
              _id: e._id ?? e.id ?? String(Math.random()),
              name: e.name ?? e.fullName ?? e.full_name ?? "Unknown",
              empId: e.empId ?? e.empID ?? e.employeeId ?? "",
              team: teamRaw,
              category: e.category ?? "",
              department: e.department ?? "",
              canonicalTeam: canonical ?? undefined,
            } as Employee;
          });
          setEmployees(normalized);
        } catch (err) {
        } finally {
          setFetchingByDept(false);
        }
      } else {
        setMessage(data?.error || "❌ Failed to submit task");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("❌ Server error. Please try again.");
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
      Backlog: "bg-gray-100 text-gray-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Paused: "bg-yellow-100 text-yellow-700",
      Completed: "bg-green-100 text-green-700",
      "On Hold": "bg-orange-100 text-orange-700",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium ${
          colors[status] || colors.Backlog
        }`}
      >
        {status === "Completed" && <CheckCircle2 className="w-3.5 h-3.5" />}
        {status}
      </span>
    );
  };

  // ✅ Corrected class: darker placeholder + black input text
  const formElementClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
    "text-black placeholder:text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl mt-20 -mb-10 font-semibold text-gray-900">
                Task Management
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alert Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.includes("successfully")
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {message.includes("successfully") ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <p
                className={`text-sm font-medium ${
                  message.includes("successfully")
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Project & Department */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Details Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Project Details
                    </h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Project ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        placeholder="e.g., PROJ-2024-001"
                        className={formElementClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={`${formElementClass} bg-white`}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="project"
                      value={formData.project}
                      onChange={handleChange}
                      placeholder="Enter project name"
                      className={formElementClass}
                    />
                  </div>
                </div>
              </div>

              {/* Assignees Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Team Assignment
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignee(s) <span className="text-red-500">*</span>
                  </label>
                  {loading || fetchingByDept ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-3" />
                      <span className="text-sm">Loading employees...</span>
                    </div>
                  ) : assigneeDisabled ? (
                    <div className="py-8 text-center text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200">
                      Please select a department first
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {filteredAssignees.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                          No employees found for {formData.department}
                        </div>
                      ) : (
                        filteredAssignees.map((emp) => (
                          <label
                            key={emp._id}
                            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              name="assigneeNames"
                              value={emp.name}
                              checked={formData.assigneeNames.includes(emp.name)}
                              onChange={handleChange}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {emp.name}
                              </div>
                              {emp.empId && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  ID: {emp.empId}
                                </div>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  {formData.assigneeNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.assigneeNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Timeline
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={formElementClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={formElementClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        className={formElementClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Status & Notes */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Progress
                    </h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`${formElementClass} bg-white`}
                    >
                      <option value="Backlog">Backlog</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Paused">Paused</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                    <div className="mt-2">
                      <StatusBadge status={formData.status} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Completion %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="completion"
                        value={formData.completion}
                        onChange={handleChange}
                        placeholder="0"
                        min={0}
                        max={100}
                        className={formElementClass}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        %
                      </span>
                    </div>
                    {formData.completion && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">
                            {formData.completion}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                            style={{
                              width: `${Math.min(
                                Number(formData.completion),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <h2 className="text-base font-semibold text-gray-900">
                      Notes
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Add any additional notes or context..."
                    rows={6}
                    className={`${formElementClass} resize-none`}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeesPage;
