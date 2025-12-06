"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation"; // ✅ added

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

const ManagerApprovalPage: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const router = useRouter(); // ✅ added

  const fetchManagerPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leaves?status=manager-pending`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setRequests(data as LeaveRequest[]);
      } else {
        console.error("Expected an array of leaves, got:", data);
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to fetch manager pending requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagerPending();
  }, [fetchManagerPending]);

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
        setRequests((prev) => prev.filter((req) => req._id !== id));
        alert(`Request ${id} successfully ${newStatus}.`);
        fetchManagerPending();
      } else {
        const errorData = await res.json();
        alert(
          `Failed to ${newStatus} request: ${
            errorData.error || "Server error"
          }`
        );
        fetchManagerPending();
      }
    } catch (error) {
      console.error(`Error updating request ${id}:`, error);
      alert(
        `Network error occurred while trying to ${newStatus} the request.`
      );
      fetchManagerPending();
    } finally {
      setIsUpdating(null);
    }
  };

  const handleApprove = (id: string) => {
    const req = requests.find((r) => r._id === id);
    if (!req || req.status !== "manager-pending") {
      alert("Only manager-pending requests can be approved here.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to APPROVE this leave request (Manager Approval)?"
      )
    ) {
      updateRequestStatus(id, "approved");
    }
  };

  const handleReject = (id: string) => {
    const req = requests.find((r) => r._id === id);
    if (!req || req.status !== "manager-pending") {
      alert("Only manager-pending requests can be rejected here.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to REJECT this leave request (Manager Approval)?"
      )
    ) {
      updateRequestStatus(id, "rejected");
    }
  };

  // ✅ navigate to full history page
  const handleViewFullHistory = () => {
    // change "/leave-history" to whatever your history page route is
    router.push("/components/emp-leave/full");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manager Leave Approval
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          These requests have already been approved by the Team Lead and are
          awaiting Manager approval.
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Pending Manager Approval ({requests.length})
            </h2>

            {/* ✅ View full history button (top-right) */}
            <button
              onClick={handleViewFullHistory}
              className="text-sm px-4 py-2 rounded-full border border-blue-500 text-blue-600 hover:bg-blue-50 font-medium"
            >
              View Full History
            </button>
          </div>

          {loading && requests.length === 0 ? (
            <p className="text-gray-600 text-sm">
              Loading manager-pending requests...
            </p>
          ) : requests.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No leave requests are currently awaiting manager approval.
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
                  {requests.map((req) => {
                    const isProcessing = isUpdating === req._id;
                    return (
                      <tr
                        key={req._id}
                        className="border-b last:border-0 hover:bg-blue-50 transition-colors"
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
                            title="Approve"
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
  );
};

export default ManagerApprovalPage;
