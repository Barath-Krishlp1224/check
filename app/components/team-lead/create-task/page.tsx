"use client";

import React, { useState, useEffect } from "react";
import { Calendar, User, Briefcase, Target, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface Employee {
  _id: string;
  name: string;
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    assigneeName: "",
    projectId: "",
    project: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dueDate: "",
    completion: "",
    status: "Backlog", // CHANGED: Initial status is now Backlog
    remarks: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.success) {
          setEmployees(data.employees);
        } else {
          console.error("Failed to fetch employees:", data.error);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.projectId.trim() || !formData.project.trim()) {
      setMessage("❌ Project ID and Project Name are required.");
      return;
    }
    
    if (!formData.assigneeName.trim()) {
        setMessage("❌ Please select an Assignee.");
        return;
    }

    try {
      const payload = {
        ...formData,
        completion: formData.completion === "" ? undefined : Number(formData.completion), 
      };

      const res = await fetch("/api/tasks/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Task submitted successfully!");
        setFormData({
          assigneeName: "",
          projectId: "",
          project: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          dueDate: "",
          completion: "",
          status: "Backlog", // Reset to Backlog
          remarks: "",
        });
      } else {
        setMessage(data?.error || "❌ Failed to submit task");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("❌ Server error. Please try again.");
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      "Backlog": "bg-slate-100 text-slate-700 border-slate-200", // ADDED: New status color
      "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
      "Paused": "bg-amber-100 text-amber-700 border-amber-200",
      "Completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "On Hold": "bg-slate-100 text-slate-700 border-slate-200"
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors]}`}>
        {status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen mt-[10%] py-8 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Create New Task
              </h1>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 rounded-xl border-l-4 p-4 shadow-sm ${
              message.includes("successfully")
                ? "bg-emerald-50 border-emerald-500"
                : "bg-red-50 border-red-500"
            }`}
          >
            <div className="flex items-center gap-3">
              {message.includes("successfully") ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`font-medium text-sm ${
                message.includes("successfully") ? "text-emerald-800" : "text-red-800"
              }`}>
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="p-8">
            {/* Project Information Card */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Project Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project ID *
                  </label>
                  <input
                    type="text"
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    placeholder="PROJ-2024-001"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="project"
                    value={formData.project}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Assignee Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-900">
                      Assignment
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assignee *
                    </label>
                    {loading ? (
                      <div className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-500 bg-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                          Loading employees...
                        </div>
                      </div>
                    ) : (
                      <select
                        name="assigneeName"
                        value={formData.assigneeName}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      >
                        <option value="">Select an assignee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp.name}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Timeline Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-900">
                      Timeline
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleChange}
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Task Progress Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-900">
                      Task Progress
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                      >
                        <option value="Backlog">Backlog</option> {/* ADDED: Backlog option */}
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
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Completion Percentage
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
                          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">
                          %
                        </span>
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

                {/* Remarks Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <h3 className="text-base font-semibold text-slate-900">
                      Additional Notes
                    </h3>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Remarks
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Add any additional comments or context..."
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Create Task
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeesPage;