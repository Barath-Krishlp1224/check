"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Filter,
  ChevronLeft,
  X
} from 'lucide-react';

interface LeaveRequest {
  _id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  description?: string;
  createdAt: string;
  employeeName?: string;
  employeeId?: string;
  email?: string;
  department?: string;
  reason?: string;
  appliedBy?: string;
}

const LeaveHistory = ({ empIdOrEmail }: { empIdOrEmail: string }) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const url = empIdOrEmail === "all" 
        ? `/api/leaves?mode=all` 
        : `/api/leaves?empIdOrEmail=${empIdOrEmail}&mode=list`;
        
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Could not load leave history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empIdOrEmail) fetchHistory();
  }, [empIdOrEmail]);

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const leaveDate = new Date(leave.startDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && leaveDate < start) return false;
      if (end && leaveDate > end) return false;
      return true;
    });
  }, [leaves, startDate, endDate]);

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved')) return 'bg-green-100 text-green-700 border-green-200';
    if (s.includes('pending')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s.includes('rejected')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('approved')) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (s.includes('pending')) return <Clock className="w-5 h-5 text-amber-600" />;
    if (s.includes('rejected')) return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-gray-600" />;
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600 font-bold uppercase tracking-widest text-xs">Loading Records...</p>
    </div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-8 bg-gray-50">
      
      {/* Detail Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setSelectedLeave(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedLeave(null)}
              className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X size={20} className="text-gray-600" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8">
              <div className="flex items-center gap-4 mb-4">
                {getStatusIcon(selectedLeave.status)}
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{selectedLeave.leaveType}</h2>
                  <p className="text-gray-300 text-sm font-medium mt-1">Leave Request Details</p>
                </div>
              </div>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase ${getStatusStyle(selectedLeave.status)}`}>
                {selectedLeave.status.replace('-', ' ')}
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Applied By</p>
                  <p className="text-sm font-bold text-gray-900">{selectedLeave.employeeName || selectedLeave.appliedBy || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Employee ID</p>
                  <p className="text-sm font-bold text-gray-900">{selectedLeave.employeeId || 'N/A'}</p>
                </div>
              </div>

              {/* Email & Department */}
              {(selectedLeave.email || selectedLeave.department) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLeave.email && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{selectedLeave.email}</p>
                    </div>
                  )}
                  {selectedLeave.department && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Department</p>
                      <p className="text-sm font-bold text-gray-900">{selectedLeave.department}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Leave Duration */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-4">Leave Duration</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Start Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">End Date</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(selectedLeave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Total Days</p>
                    <p className="text-2xl font-black text-blue-600">{selectedLeave.days}</p>
                  </div>
                </div>
              </div>

              {/* Reason/Description */}
              {(selectedLeave.description || selectedLeave.reason) && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Reason</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedLeave.description || selectedLeave.reason}</p>
                </div>
              )}

              {/* Application Date */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Applied On</p>
                <p className="text-sm font-bold text-gray-900">{new Date(selectedLeave.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setSelectedLeave(null)}
                className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-bold text-sm uppercase tracking-wider"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl w-full space-y-8">
        
        {/* HEADER WITH TITLE ON LEFT */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-gray-800 p-4 rounded-3xl shadow-xl shadow-gray-200">
              <Calendar className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Employee Leave Portal
              </h1>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-1">
                Request history & tracking
              </p>
            </div>
          </div>
        </div>

        {/* FILTER SECTION */}
        
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-2 ml-1">Filter by Period</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                onChange={(e) => {
                  const value = e.target.value;
                  const now = new Date();
                  
                  if (value === 'custom') {
                    // Keep current dates or clear them
                    return;
                  } else if (value === 'last-month') {
                    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                    setStartDate(firstDay.toISOString().split('T')[0]);
                    setEndDate(lastDay.toISOString().split('T')[0]);
                  } else if (value === 'last-3-months') {
                    const firstDay = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                    setStartDate(firstDay.toISOString().split('T')[0]);
                    setEndDate(now.toISOString().split('T')[0]);
                  } else if (value === 'last-year') {
                    const firstDay = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                    setStartDate(firstDay.toISOString().split('T')[0]);
                    setEndDate(now.toISOString().split('T')[0]);
                  } else if (value === 'all') {
                    setStartDate("");
                    setEndDate("");
                  }
                }}
                className="w-70 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800 font-bold cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="last-year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

        

        {/* TABLE SECTION */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Request History</h3>
             
            </div>
          
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Date Logged</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Category</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">Schedule</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center border-b border-gray-100">Duration</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right border-b border-gray-100">Status</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-gray-50">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <div className="space-y-3">
                        <Filter className="w-12 h-12 text-gray-100 mx-auto" />
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-tighter">No matching results found</p>
                        <button onClick={() => {setStartDate(""); setEndDate("");}} className="text-blue-600 text-xs font-bold underline">Clear all filters</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr 
                      key={leave._id} 
                      onClick={() => setSelectedLeave(leave)}
                      className="hover:bg-blue-50/30 transition-all group cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-gray-500">
                          {new Date(leave.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-800 uppercase tracking-tight">
                            {leave.leaveType}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
                            {leave.description || "Official Leave Request"}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-300" />
                          {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-block w-10 py-1 rounded-lg bg-gray-900 text-[10px] font-black text-white shadow-md shadow-gray-200">
                          {leave.days}D
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(leave.status)}`}>
                          {leave.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistory;