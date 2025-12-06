"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Clock, User, FileText } from "lucide-react";

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

const LeaveHistoryPage = () => {
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 👇 Change API according to your backend
        const res = await fetch("/api/leaves");
        const json = await res.json();

        if (Array.isArray(json)) {
          setData(json);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case "approved":
      case "auto-approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "pending":
      case "manager-pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case "sick":
        return "bg-red-50 text-red-700";
      case "casual":
        return "bg-blue-50 text-blue-700";
      case "planned":
        return "bg-purple-50 text-purple-700";
      case "unplanned":
        return "bg-orange-50 text-orange-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full">
        {/* Header Section */}
        <div className="text-left mb-8">
         
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Leave History
          </h1>
          <p className="text-gray-600 text-lg">
            Complete overview of all employee leave requests
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500 text-sm">Loading leave history...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No leave records found</p>
              <p className="text-gray-400 text-sm mt-1">Check back later for updates</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Employee
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Duration
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Requested
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((req, index) => (
                    <tr
                      key={req._id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                      style={{
                        animation: `fadeIn 0.3s ease-in ${index * 0.05}s backwards`
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                            {(req.employeeName || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {req.employeeName || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {req.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${getLeaveTypeColor(
                            req.leaveType
                          )}`}
                        >
                          {req.leaveType}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            {formatDate(req.startDate)}
                          </p>
                          <p className="text-gray-500 text-xs">
                            to {formatDate(req.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                          {req.days}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border ${getStatusColor(
                            req.status
                          )}`}
                        >
                          {req.status.replace("-", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <p
                          className="text-sm text-gray-600 truncate"
                          title={req.description}
                        >
                          {req.description || "-"}
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">
                          {formatDate(req.createdAt)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LeaveHistoryPage;