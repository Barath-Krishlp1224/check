"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Zap,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaveSummary {
  sick: number;
  casual: number;
  plannedRequests: number;
  unplannedRequests: number;
}

type LeaveType = "sick" | "casual" | "planned" | "unplanned";
type LeaveStatus = "pending" | "approved" | "rejected" | "auto-approved";

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

const calculateDaysDifference = (start: string, end: string): number => {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    return 0;
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1;
};

const LeaveForm = () => {
  const router = useRouter();
  const [summary, setSummary] = useState<LeaveSummary>({
    sick: 12,
    casual: 12,
    plannedRequests: 0,
    unplannedRequests: 0,
  });

  const [leaveType, setLeaveType] = useState<LeaveType>("sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(0);
  const [description, setDescription] = useState("");

  const [empIdOrEmail, setEmpIdOrEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("Loading...");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State for messages
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // State for user requests
  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // --- Initial Setup (User Info & Day Calculation) ---

  useEffect(() => {
    const id = localStorage.getItem("userEmpId");
    const name = localStorage.getItem("userName");

    if (id) {
      setEmpIdOrEmail(id);
      setEmployeeName(name || id);
      setIsLoggedIn(true);
    } else {
      setEmployeeName("User not logged in");
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    const calculatedDays = calculateDaysDifference(startDate, endDate);
    setDays(calculatedDays);
  }, [startDate, endDate]);

  // --- Data Fetching Functions ---

  const fetchBalance = async (idOrEmail: string) => {
    if (!idOrEmail || !isLoggedIn) {
      setSummary({
        sick: 12,
        casual: 12,
        plannedRequests: 0,
        unplannedRequests: 0,
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/leaves?empIdOrEmail=${encodeURIComponent(idOrEmail)}`
      );

      if (res.ok) {
        const data: LeaveSummary = await res.json();
        setSummary(data);
        setMessage("");
      } else {
        const errorData = await res.json();
        console.error("Failed to load balance:", errorData.error);
      }
    } catch (error) {
      console.error("Network or parsing error:", error);
    }
  };

  const fetchUserRequests = useCallback(async (idOrEmail: string) => {
    if (!idOrEmail.trim() || !isLoggedIn) {
      setUserRequests([]);
      return;
    }

    try {
      setLoadingRequests(true);

      const res = await fetch(
        `/api/leaves?empIdOrEmail=${encodeURIComponent(
          idOrEmail.trim()
        )}&mode=list`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        setUserRequests(data as LeaveRequest[]);
      } else {
        console.error("Expected array for user requests, got:", data);
        setUserRequests([]);
      }
    } catch (err) {
      console.error("Error fetching user requests:", err);
      setUserRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, [isLoggedIn]); // Dependencies for useCallback

  // --- Effects for Data Management (Initial Load and Polling) ---

  // Effect to fetch balance on load
  useEffect(() => {
    fetchBalance(empIdOrEmail);
  }, [empIdOrEmail, isLoggedIn]);

  // VVVV --- NEW POLLING MECHANISM FOR REQUESTS --- VVVV
  useEffect(() => {
    if (!isLoggedIn || !empIdOrEmail) return;

    // 1. Initial fetch on load/login
    fetchUserRequests(empIdOrEmail); 

    // 2. Set up interval for polling (e.g., every 30 seconds)
    const intervalId = setInterval(() => {
      console.log('Polling for updated leave requests...');
      fetchUserRequests(empIdOrEmail);
    }, 30000); // 30 seconds

    // 3. Cleanup function to clear the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
      console.log('Leave request polling stopped.');
    };
  }, [empIdOrEmail, isLoggedIn, fetchUserRequests]);
  // ^^^^ --- END OF NEW POLLING MECHANISM --- ^^^^


  // --- Form Validation and Submission ---

  const validateForm = () => {
    setMessage("");

    if (!empIdOrEmail.trim() || !isLoggedIn) {
      setMessageType("error");
      setMessage("User not logged in. Please log in to apply for leave.");
      return false;
    }

    if (!startDate || !endDate) {
      setMessageType("error");
      setMessage("Start Date and End Date are required.");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setMessageType("error");
      setMessage("Start Date cannot be after End Date.");
      return false;
    }

    if (days <= 0) {
      setMessageType("error");
      setMessage("Invalid date range selected.");
      return false;
    }

    if (
      (leaveType === "planned" || leaveType === "unplanned") &&
      !description.trim()
    ) {
      setMessageType("error");
      setMessage(
        "A description is required for Planned and Unplanned leaves."
      );
      return false;
    }

    if (leaveType === "sick" && days > summary.sick) {
      setMessageType("error");
      setMessage(
        `Cannot apply for ${days} sick day(s). Only ${summary.sick} day(s) remaining for the year.`
      );
      return false;
    }

    if (leaveType === "casual" && days > summary.casual) {
      setMessageType("error");
      setMessage(
        `Cannot apply for ${days} casual day(s). Only ${summary.casual} day(s) remaining for the year.`
      );
      return false;
    }

    return true;
  };

  const handleApply = async () => {
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empIdOrEmail: empIdOrEmail.trim(),
          leaveType,
          startDate,
          endDate,
          days,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error || "Failed to submit leave request");
        return;
      }

      const { leave, remainingSick, remainingCasual } = data;

      // Update balance summary
      setSummary((prev) => ({
        ...prev,
        sick: remainingSick,
        casual: remainingCasual,
        plannedRequests:
          leave.leaveType === "planned" && leave.status === "pending"
            ? prev.plannedRequests + leave.days
            : prev.plannedRequests,
        unplannedRequests:
          leave.leaveType === "unplanned" && leave.status === "pending"
            ? prev.unplannedRequests + leave.days
            : prev.unplannedRequests,
      }));

      const status = leave.status as LeaveStatus;

      setMessageType("success");
      setMessage(
        status === "auto-approved"
          ? `${leave.leaveType.toUpperCase()} Leave for ${
              leave.days
            } day(s) auto-approved.`
          : `Request submitted for ${leave.days} day(s). Pending approval.`
      );

      setDescription("");
      setStartDate("");
      setEndDate("");

      // Re-fetch the list of requests to show the newly submitted one immediately
      fetchUserRequests(empIdOrEmail); 
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  // --- Rendering Helpers ---

  const CompactStatusBox = ({
    title,
    value,
    icon: Icon,
    colorClass,
    isPending = false,
  }: {
    title: string;
    value: number;
    icon?: React.ElementType;
    colorClass: string;
    isPending?: boolean;
  }) => (
    <div
      className={`p-3 rounded-xl border ${colorClass} shadow-sm w-1/2 flex items-center justify-between transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex flex-col">
        <p
          className={`text-xl font-extrabold ${
            isPending ? "text-gray-700" : "text-indigo-600"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {title}
        </p>
      </div>
      {Icon && (
        <Icon
          className={`w-5 h-5 flex-shrink-0 ${
            isPending ? "text-gray-400" : "text-indigo-500"
          }`}
        />
      )}
    </div>
  );

  const hasPendingRequests =
    summary.plannedRequests > 0 || summary.unplannedRequests > 0;

  const getButtonText = () => {
    if (leaveType === "sick" || leaveType === "casual") {
      const isAutoApproved = days === 1;
      
      if (isAutoApproved) {
        return "Apply (Auto-Approve)";
      } 
      return "Send Request for Approval";
    }
    return "Send Request";
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString();

  const renderStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case "auto-approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800">
            <Zap className="w-3 h-3" /> Auto-Approved
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const pendingRequests = userRequests.filter((r) => r.status === "pending");
  const historyRequests = userRequests.filter((r) => r.status !== "pending");

  // --- Render (Login check) ---

  if (!isLoggedIn) {
      return (
          <div className="min-h-screen flex items-center justify-center p-4">
              <div className="text-center p-8 bg-white rounded-xl shadow-xl">
                  <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                  <p className="text-gray-700 mb-6">You must be logged in to access the leave application form.</p>
                  <button 
                      onClick={() => router.push("/")}
                      className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                      Go to Login
                  </button>
              </div>
          </div>
      );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl w-full space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Leave Application
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Submit your leave request and manage your balance & history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                <h2 className="text-lg font-extrabold text-indigo-700 uppercase tracking-wide border-b pb-2">
                  Available Balance
                </h2>

                <div className="flex space-x-4">
                  <CompactStatusBox
                    title="Sick Leave (12 days/year)"
                    value={summary.sick}
                    colorClass="bg-blue-50 border-indigo-100"
                  />
                  <CompactStatusBox
                    title="Casual Leave (12 days/year)"
                    value={summary.casual}
                    colorClass="bg-purple-50 border-purple-100"
                  />
                </div>

                {hasPendingRequests && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-extrabold text-gray-700 uppercase tracking-wide pt-4 border-t mt-4">
                      Pending Requests (Days)
                    </h2>

                    <div className="flex space-x-4">
                      {summary.plannedRequests > 0 && (
                        <CompactStatusBox
                          title="Planned Pending"
                          value={summary.plannedRequests}
                          icon={FileText}
                          colorClass="bg-gray-50 border-gray-200"
                          isPending
                        />
                      )}
                      {summary.unplannedRequests > 0 && (
                        <CompactStatusBox
                          title="Unplanned Pending"
                          value={summary.unplannedRequests}
                          icon={FileText}
                          colorClass="bg-gray-50 border-gray-200"
                          isPending
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Application Form
              </h2>

              <div className="space-y-6">
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Applying For:
                  </label>
                  <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-300 rounded-lg text-indigo-800 font-bold flex items-center">
                    <User className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{employeeName}</span>
                    <span className="text-xs font-normal ml-2 text-indigo-600">({empIdOrEmail})</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                  >
                    <option value="sick">
                      Sick Leave (1 day Auto-Approved, {'>'}1 day Approval Required)
                    </option>
                    <option value="casual">
                      Casual Leave (1 day Auto-Approved, {'>'}1 day Approval Required)
                    </option>
                    <option value="planned">
                      Planned Leave (Approval Required)
                    </option>
                    <option value="unplanned">
                      Unplanned Leave (Approval Required)
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-lg">
                  <p className="text-sm font-medium text-indigo-700">
                    <Calendar className="inline w-4 h-4 mr-2 -mt-0.5" />
                    Calculated Days:{" "}
                    <span className="text-lg font-bold">{days}</span> day(s)
                  </p>
                </div>

                {(leaveType === "planned" || leaveType === "unplanned") && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description (
                      {leaveType === "planned" ? "Planned" : "Unplanned"} Leave)
                    </label>
                    <textarea
                      value={description}
                      placeholder="Please provide a detailed description for your leave request..."
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-gray-700"
                    />
                  </div>
                )}

                <button
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {getButtonText()}
                </button>

                {message && (
                  <div
                    className={`flex items-start gap-3 p-4 rounded-lg ${
                      messageType === "success"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    {messageType === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-sm font-medium ${
                        messageType === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            My Leave Requests
          </h2>

          {loadingRequests ? (
            <p className="text-sm text-gray-600">Loading your requests...</p>
          ) : userRequests.length === 0 ? (
            <p className="text-sm text-gray-600">
              No leave requests found for this Employee ID yet.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Pending Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You have no pending leave requests.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-900">
                      <thead>
                        <tr className="border-b text-left bg-gray-50">
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Dates</th>
                          <th className="py-2 pr-4">Days</th>
                          <th className="py-2 pr-4 max-w-xs">
                            Description/Reason
                          </th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Requested On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRequests.map((req) => (
                          <tr
                            key={req._id}
                            className="border-b last:border-0 hover:bg-yellow-50 transition-colors"
                          >
                            <td className="py-2 pr-4 capitalize">
                              {req.leaveType}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {formatDate(req.startDate)} -{" "}
                              {formatDate(req.endDate)}
                            </td>
                            <td className="py-2 pr-4 font-semibold">
                              {req.days}
                            </td>
                            <td
                              className="py-2 pr-4 max-w-xs truncate"
                              title={req.description}
                            >
                              {req.description || "-"}
                            </td>
                            <td className="py-2 pr-4">
                              {renderStatusBadge(req.status)}
                            </td>
                            <td className="py-2 pr-4">
                              {formatDate(req.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  History ({historyRequests.length})
                </h3>
                {historyRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No approved/rejected/auto-approved leaves yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-gray-900">
                      <thead>
                        <tr className="border-b text-left bg-gray-50">
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Dates</th>
                          <th className="py-2 pr-4">Days</th>
                          <th className="py-2 pr-4 max-w-xs">
                            Description/Reason
                          </th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Requested On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRequests.map((req) => (
                          <tr
                            key={req._id}
                            className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-2 pr-4 capitalize">
                              {req.leaveType}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {formatDate(req.startDate)} -{" "}
                              {formatDate(req.endDate)}
                            </td>
                            <td className="py-2 pr-4">{req.days}</td>
                            <td
                              className="py-2 pr-4 max-w-xs truncate"
                              title={req.description}
                            >
                              {req.description || "-"}
                            </td>
                            <td className="py-2 pr-4">
                              {renderStatusBadge(req.status)}
                            </td>
                            <td className="py-2 pr-4">
                              {formatDate(req.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;