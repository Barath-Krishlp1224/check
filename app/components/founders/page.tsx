"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckSquare, TrendingUp, Calendar, Loader2, Clock, XCircle } from "lucide-react";

interface AttendanceRecord {
  id: number;
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Punched';
  punchInTime: string | null;
}

const fetchAttendanceData = async (): Promise<AttendanceRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const mockData: AttendanceRecord[] = [
    { id: 1, employeeName: "Alice Johnson", date: "2025-12-01", status: "Punched", punchInTime: "09:05 AM" },
    { id: 2, employeeName: "Bob Smith", date: "2025-12-01", status: "Late", punchInTime: "09:30 AM" },
    { id: 3, employeeName: "Charlie Brown", date: "2025-12-01", status: "Absent", punchInTime: null },
    { id: 4, employeeName: "David Lee", date: "2025-11-30", status: "Punched", punchInTime: "09:00 AM" },
    { id: 5, employeeName: "Eva Green", date: "2025-11-30", status: "Punched", punchInTime: "08:55 AM" },
    { id: 6, employeeName: "Frank Miller", date: "2025-11-30", status: "Absent", punchInTime: null },
    { id: 7, employeeName: "Grace Hall", date: "2025-11-29", status: "Punched", punchInTime: "09:15 AM" },
  ];
  
  return mockData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export default function AdminPage() {
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isQuickActionsOpen] = useState(true);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(true);

    const loadAttendance = async () => {
      try {
        setLoadingAttendance(true);
        const data = await fetchAttendanceData();
        setAttendance(data);
        setAttendanceError(null);
      } catch (error) {
        setAttendanceError("Failed to load attendance records.");
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadAttendance();
  }, []);

  const goToEmployeeList = () => { router.push("/components/founders/view-emp"); };
  const goToBillsPage = () => { router.push("/components/founders/bills"); };
  const goToExpensesPage = () => { router.push("/components/founders/expenses"); };
  const goToLeavesPage = () => { router.push("/components/emp-leave/approval"); };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'Punched':
      case 'Present': return "bg-green-100 text-green-800";
      case 'Late': return "bg-yellow-100 text-yellow-800";
      case 'Absent': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const recentAttendance = attendance.slice(0, 5);
  const otherAttendance = attendance.slice(5);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div>
          <div className={`mb-12 transition-all duration-700 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
            <div className="relative text-center">
              <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome to the Founder's Dashboard</h1>
              <p className="text-gray-600 text-lg mb-4">
                Overview of your organization's structure and quick access tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            <div className="xl:col-span-2"> 
              <div className={`transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
                
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isQuickActionsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                    
                    <div
                      role="button" onClick={goToEmployeeList}
                      className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${hoveredButton === "view" ? "scale-[1.02]" : "scale-100"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "0ms" : "0ms" }}
                      onMouseEnter={() => setHoveredButton("view")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">View Employee List</h3>
                          <p className="text-gray-600 text-xs">Complete directory</p>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      role="button" onClick={() => router.push("/components/all-tasks/task-view")}
                      className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "150ms" : "0ms" }}
                      onMouseEnter={() => setHoveredButton("tasks")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">Tasks & Performance</h3>
                          <p className="text-gray-600 text-xs">Monitor metrics</p>
                        </div>
                      </div>
                    </div>

                    <div
                      role="button" onClick={goToBillsPage}
                      className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "300ms" : "0ms" }} 
                      onMouseEnter={() => setHoveredButton("bills")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <Users className="w-5 h-5 text-white" /> 
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">View Bills</h3>
                          <p className="text-gray-600 text-xs">Financial records</p>
                        </div>
                      </div>
                    </div>

                    <div
                      role="button" onClick={goToExpensesPage}
                      className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "450ms" : "0ms" }} 
                      onMouseEnter={() => setHoveredButton("expenses")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">View Expenses</h3>
                          <p className="text-gray-600 text-xs">Expense reports</p>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      role="button" onClick={goToLeavesPage}
                      className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "600ms" : "0ms" }} 
                      onMouseEnter={() => setHoveredButton("leaves")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">View Leaves</h3>
                          <p className="text-gray-600 text-xs">Manage time off</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className={`transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-md h-full">
                  
                  {loadingAttendance && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mb-2" />
                      <p>Fetching recent records...</p>
                    </div>
                  )}

                  {attendanceError && (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500 p-4">
                      <XCircle className="w-6 h-6 mb-2" />
                      <p className="font-medium">Error: {attendanceError}</p>
                    </div>
                  )}

                  {!loadingAttendance && !attendanceError && (
                    <div className="flex flex-col">
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-1">Most Recent Records</h3>
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {recentAttendance.map((record) => (
                              <tr key={record.id}>
                                <td className="px-1 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[80px]">{record.employeeName.split(' ')[0]}</td>
                                <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{record.date.substring(5)}</td>
                                <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-700">
                                    {record.punchInTime || '-'}
                                </td>
                                <td className="px-1 py-2 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                                    {record.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {otherAttendance.length > 0 && (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-1">Previous Records</h3>
                          <div className="overflow-y-auto max-h-48 border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {otherAttendance.map((record) => (
                                  <tr key={record.id}>
                                    <td className="px-1 py-2 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-[80px]">{record.employeeName.split(' ')[0]}</td>
                                    <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-500">{record.date.substring(5)}</td>
                                    <td className="px-1 py-2 whitespace-nowrap text-xs text-gray-700">
                                        {record.punchInTime || '-'}
                                    </td>
                                    <td className="px-1 py-2 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                                        {record.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                      
                      {attendance.length === 0 && (
                        <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                            <Clock className="w-5 h-5 mr-2"/>
                            <p>No attendance records found.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div> 
        </div>
      </div>
    </div>
  );
}