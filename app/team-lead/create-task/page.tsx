"use client";

import React, { useState, useEffect } from "react";

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
    status: "In Progress",
    remarks: "",
  });

  const [message, setMessage] = useState("");

  // 🔹 Fetch employees from DB
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

  // 🔹 Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // 🔹 Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.projectId.trim() || !formData.project.trim()) {
      setMessage("❌ Project ID and Project Name are required.");
      return;
    }
    
    // Check for a selected assignee
    if (!formData.assigneeName.trim()) {
        setMessage("❌ Please select an Assignee.");
        return;
    }

    try {
      const payload = {
        ...formData,
        // Frontend conversion to Number for completion field
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
          status: "In Progress",
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

  return (
    <div className="min-h-screen from-slate-100 via-white to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mt-[3%] mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Employee's Task Creation
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {message && (
            <div
              className={`px-6 py-4 ${
                message.includes("successfully")
                  ? "bg-green-50 border-b-2 border-green-600"
                  : "bg-red-50 border-b-2 border-red-600"
              }`}
            >
              <p
                className={`font-semibold flex items-center gap-2 ${
                  message.includes("successfully") ? "text-green-700" : "text-red-700"
                }`}
              >
                <span className="text-xl">
                  {message.includes("successfully") ? "✓" : "⚠"}
                </span>
                {message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project ID */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  🆔 Project ID
                </label>
                <input
                  type="text"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  placeholder="e.g., PROJ-2024-001"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  📁 Project Name
                </label>
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  ▶️ Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  🛑 End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  ⏳ Due Date
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>

              {/* Completion */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  📊 Completion Percentage
                </label>
                <input
                  type="number"
                  name="completion"
                  value={formData.completion}
                  onChange={handleChange}
                  placeholder="0 - 100"
                  min={0}
                  max={100}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 pr-10 text-black focus:border-black"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  🔄 Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black bg-white focus:border-black"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Paused">Paused</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* 🔹 Assignee Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  👤 Assignee
                </label>
                {loading ? (
                  <p className="text-gray-500">Loading employees...</p>
                ) : (
                  <select
                    name="assigneeName"
                    value={formData.assigneeName}
                    onChange={handleChange}
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black bg-white focus:border-black"
                  >
                    <option value="">Select Assignee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-black mb-2">
                  💬 Remarks
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Any additional comments or notes"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-black focus:border-black"
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                className="w-full bg-black text-white font-bold py-4 px-6 rounded-xl hover:bg-gray-800 transform hover:scale-[1.01] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Submit Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;