"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Check, X, Clock, Zap, Search, User, FileText } from "lucide-react";

type LeaveType = "sick" | "casual" | "planned" | "unplanned" | "";

type LeaveStatus =
  | "pending"
  | "manager-pending"
  | "approved"
  | "rejected"
  | "auto-approved";

interface LeaveRequest {
  _id: string;
  employeeName?: string;
  employeeId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  description?: string;
  status: LeaveStatus;
  createdAt: string;
}

interface EmployeeOption {
  empId: string;
  name: string;
}

const ApprovalPage: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [filterEmployee, setFilterEmployee] = useState("");
  const [selectedEmployeeEmpId, setSelectedEmployeeEmpId] = useState("");
  const [filterLeaveType, setFilterLeaveType] = useState<LeaveType>("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | "all">("all");

  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);

  const employeeBoxRef = useRef<HTMLDivElement | null>(null);

  const buildQueryString = () => {
    const params = new URLSearchParams();

    if (selectedEmployeeEmpId) {
      params.append("employeeId", selectedEmployeeEmpId);
    } else if (filterEmployee.trim()) {
      // If an empId isn't selected but text is typed, filter by name
      params.append("employeeName", filterEmployee.trim());
    }

    if (filterLeaveType) {
      params.append("leaveType", filterLeaveType);
    }
    // Only append status if it's not "all"
    if (filterStatus !== "all") {
      params.append("status", filterStatus);
    } else {
      // When "all" is selected, we want to fetch all requests (pending + history)
      // but if we are *not* filtering, we only want to fetch pending requests
      // for the main view to keep the initial load clean.
      // However, since the prompt only asks for Pending Requests now,
      // we'll explicitly only fetch 'pending' if 'all' is selected and no other filters are active.
      if (!selectedEmployeeEmpId && !filterEmployee && !filterLeaveType) {
        params.append("status", "pending");
      }
    }

    return params.toString();
  };

  const fetchAllRequests = useCallback(async () => {
    const queryString = buildQueryString();
    try {
      setLoading(true);
      // NOTE: Assuming your API is set up to handle the filtering based on the query string
      const res = await fetch(`/api/leaves?${queryString}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRequests(data as LeaveRequest[]);
      } else {
        console.error("Expected an array of leaves, got:", data);
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch all requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, selectedEmployeeEmpId, filterLeaveType, filterStatus]);

  useEffect(() => {
    if (!employeeDropdownOpen) {
      const handler = setTimeout(() => {
        fetchAllRequests();
      }, 300);

      return () => clearTimeout(handler);
    }
  }, [
    filterEmployee,
    selectedEmployeeEmpId,
    filterLeaveType,
    filterStatus,
    employeeDropdownOpen,
    fetchAllRequests,
  ]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          setEmployeeOptions(
            data.employees.map((emp: any) => ({
              empId: emp.empId,
              name: emp.name,
            }))
          );
        } else {
          console.error("Unexpected employees response:", data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        employeeBoxRef.current &&
        !employeeBoxRef.current.contains(e.target as Node)
      ) {
        setEmployeeDropdownOpen(false);
        // Only trigger fetch if filterEmployee has content to apply a search on blur
        if (filterEmployee) {
          fetchAllRequests();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterEmployee, fetchAllRequests]);

  const handleClearFilter = () => {
    setFilterEmployee("");
    setSelectedEmployeeEmpId("");
    setFilterLeaveType("");
    setFilterStatus("all");
    setEmployeeDropdownOpen(false);
  };

  const handleEmployeeInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFilterEmployee(value);
    setSelectedEmployeeEmpId("");
    setEmployeeDropdownOpen(true);
  };

  const handleEmployeeSelect = (opt: EmployeeOption) => {
    setFilterEmployee(`${opt.name} (${opt.empId})`);
    setSelectedEmployeeEmpId(opt.empId);
    setEmployeeDropdownOpen(false);
  };

  const filteredEmployeeOptions = employeeOptions.filter((opt) =>
    `${opt.name} ${opt.empId}`
      .toLowerCase()
      .includes(filterEmployee.toLowerCase())
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();

  const updateRequestStatus = async (id: string, newStatus: LeaveStatus) => {
    setIsUpdating(id);
    try {
      const res = await fetch(`/api/leaves/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Optimistically update the local state for a smoother UI experience
        setRequests((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, status: newStatus } : req
          )
        );
        alert(`Request ${id} successfully moved to ${newStatus}.`);
        // Re-fetch to ensure the list is accurate after the update and filtering is correct
        fetchAllRequests();
      } else {
        const errorData = await res.json();
        alert(
          `Failed to update request: ${
            errorData.error || "Server error"
          }`
        );
        // Re-fetch in case of failure to revert optimistic update or check status
        fetchAllRequests();
      }
    } catch (error) {
      console.error(`Error updating request ${id}:`, error);
      alert(
        `Network error occurred while trying to update the request.`
      );
      // Re-fetch on network error
      fetchAllRequests();
    } finally {
      setIsUpdating(null);
    }
  };

  const handleApprove = (id: string) => {
    const request = requests.find((r) => r._id === id);
    if (request && request.status !== "pending") {
      alert(
        "This request is not pending and cannot be manually approved or rejected."
      );
      return;
    }

    if (window.confirm("Are you sure you want to APPROVE this leave request and forward it to the Manager?")) {
      // NOTE: Approving at TL level changes status to 'manager-pending'
      updateRequestStatus(id, "manager-pending");
    }
  };

  const handleReject = (id: string) => {
    const request = requests.find((r) => r._id === id);
    if (request && request.status !== "pending") {
      alert(
        "This request is not pending and cannot be manually approved or rejected."
      );
      return;
    }

    if (window.confirm("Are you sure you want to REJECT this leave request?")) {
      updateRequestStatus(id, "rejected");
    }
  };

  // Only display 'pending' requests in the main table
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const isFilterActive =
    !!filterEmployee ||
    !!selectedEmployeeEmpId ||
    !!filterLeaveType ||
    filterStatus !== "all";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-7xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Leave Approval (Team Lead)
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          View and action **Pending** leave requests submitted by employees. Action buttons are
          only shown for requests with **Pending** status.
        </p>

        <div className="bg-white rounded-xl shadow-md p-5 mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Filter Requests
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div ref={employeeBoxRef} className="relative">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Employee ID or Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filterEmployee}
                  onChange={handleEmployeeInputChange}
                  onFocus={() => setEmployeeDropdownOpen(true)}
                  placeholder="e.g., EMP001 or John Doe"
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-600"
                />
              </div>

              {employeeDropdownOpen && filteredEmployeeOptions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto text-sm">
                  {filteredEmployeeOptions.map((opt) => (
                    <li
                      key={opt.empId}
                      onClick={() => handleEmployeeSelect(opt)}
                      className="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-gray-900 truncate"
                    >
                      <span className="font-medium">{opt.name}</span>{" "}
                      <span className="text-gray-500">({opt.empId})</span>
                    </li>
                  ))}
                </ul>
              )}

              {employeeDropdownOpen && filteredEmployeeOptions.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg text-xs text-gray-500 px-3 py-2">
                  No employees match this search.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Leave Type
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterLeaveType}
                  onChange={(e) =>
                    setFilterLeaveType(e.target.value as LeaveType)
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white text-gray-900"
                >
                  <option value="">All Types</option>
                  <option value="sick">Sick</option>
                  <option value="casual">Casual</option>
                  <option value="planned">Planned</option>
                  <option value="unplanned">Unplanned</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as LeaveStatus | "all")
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white text-gray-900"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="manager-pending">Manager Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="auto-approved">Auto-Approved</option>
                </select>
              </div>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={handleClearFilter}
                disabled={loading || !isFilterActive}
                className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Pending Requests ({pendingRequests.length})
              </h2>
            </div>

            {loading && pendingRequests.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Loading pending requests...
              </p>
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-600 text-sm">
                No **Pending** leave requests found{" "}
                {isFilterActive ? "for current filters" : ""}.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-gray-900">
                  <thead>
                    <tr className="border-b text-left bg-gray-50">
                      <th className="py-3 pr-4">Employee</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Dates</th>
                      <th className="py-3 pr-4">Days</th>
                      <th className="py-3 pr-4 max-w-xs">
                        Description/Reason
                      </th>
                      <th className="py-3 pr-4">Requested On</th>
                      <th className="py-3 pl-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((req) => {
                      const isProcessing = isUpdating === req._id;
                      return (
                        <tr
                          key={req._id}
                          className="border-b last:border-0 hover:bg-yellow-50 transition-colors"
                        >
                          <td className="py-2 pr-4 font-medium">
                            {req.employeeName || "Unknown"}
                            {req.employeeId && (
                              <span className="block text-xs text-gray-500">
                                ID: {req.employeeId}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-4 capitalize">
                            {req.leaveType}
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {formatDate(req.startDate)} -{" "}
                            {formatDate(req.endDate)}
                          </td>
                          <td className="py-2 pr-4 font-bold">{req.days}</td>
                          <td
                            className="py-2 pr-4 max-w-xs truncate"
                            title={req.description}
                          >
                            {req.description || "-"}
                          </td>
                          <td className="py-2 pr-4">
                            {formatDate(req.createdAt)}
                          </td>
                          <td className="py-2 pl-4 flex gap-2 justify-center">
                            <button
                              onClick={() => handleApprove(req._id)}
                              disabled={isProcessing}
                              className={`p-1 rounded-full text-white ${
                                isProcessing
                                  ? "bg-gray-400"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              title="Approve (send to Manager)"
                            >
                              {isProcessing ? (
                                <span className="text-xs px-1">...</span>
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(req._id)}
                              disabled={isProcessing}
                              className={`p-1 rounded-full text-white ${
                                isProcessing
                                  ? "bg-gray-400"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                              title="Reject"
                            >
                              {isProcessing ? (
                                <span className="text-xs px-1">...</span>
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPage;