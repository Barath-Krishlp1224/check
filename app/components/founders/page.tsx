"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckSquare, Plus, Minus, TrendingUp } from "lucide-react";

interface EmployeeStats {
  totalEmployees: number;
  foundersTeamCount: number;
  managerTeamCount: number;
  tlReportingManagerTeamCount: number;
  itAdminTeamCount: number;
  techTeamCount: number;
  accountsTeamCount: number;
  hrTeamCount: number;
  adminOpsTeamCount: number;
  housekeepingTeamCount: number; 
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    foundersTeamCount: 0,
    managerTeamCount: 0,
    tlReportingManagerTeamCount: 0,
    itAdminTeamCount: 0,
    techTeamCount: 0,
    accountsTeamCount: 0,
    hrTeamCount: 0,
    adminOpsTeamCount: 0,
    housekeepingTeamCount: 0,
  });

  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isStaffCountOpen, setIsStaffCountOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/employees/stats");
        const data = await res.json();

        if (!data || data.error) {
          console.error("Error fetching stats:", data?.error ?? data);
          return;
        }

        setStats({
          totalEmployees: data.totalEmployees ?? 0,
          foundersTeamCount: data.foundersTeamCount ?? 0,
          managerTeamCount: data.managerTeamCount ?? 0,
          tlReportingManagerTeamCount:
            data.tlReportingManagerTeamCount ?? 0,
          itAdminTeamCount: data.itAdminTeamCount ?? 0,
          techTeamCount: data.techTeamCount ?? 0,
          accountsTeamCount: data.accountsTeamCount ?? 0,
          hrTeamCount: data.hrTeamCount ?? 0,
          adminOpsTeamCount: data.adminOpsTeamCount ?? 0,
          housekeepingTeamCount: data.housekeepingTeamCount ?? 0,
        });
      } catch (err) {
        console.error("Error fetching employee stats:", err);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    { label: "Total Employees", value: stats.totalEmployees, icon: "/1.png" },
    { label: "Founders", value: stats.foundersTeamCount, icon: "/2.png" },
    { label: "Manager Team", value: stats.managerTeamCount, icon: "/3.png" },
    { label: "TL - Reporting Manager", value: stats.tlReportingManagerTeamCount, icon: "/4.png" },
    { label: "IT Admin Team", value: stats.itAdminTeamCount, icon: "/5.png" },
    { label: "Tech Team", value: stats.techTeamCount, icon: "/6.png" },
    { label: "Accounts Team", value: stats.accountsTeamCount, icon: "/7.png" },
    { label: "HR Team", value: stats.hrTeamCount, icon: "/8.png" },
    { label: "Admin & Ops Team", value: stats.adminOpsTeamCount, icon: "/9.png" },
    { label: "Housekeeping Team", value: stats.housekeepingTeamCount, icon: "/10.png" },
  ];

  const toggleStaffCount = () => setIsStaffCountOpen((s) => !s);
  const toggleQuickActions = () => setIsQuickActionsOpen((s) => !s);

  const goToEmployeeList = () => {
    router.push("/components/founders/view-emp");
  };

  const goToBillsPage = () => {
    // Assuming the bills page is located at /components/bills-view or similar
    router.push("/components/founders/bills"); 
  };

  const goToHousekeepingList = () => {
    // navigate to the same view page but with a query param for filtering if supported
    router.push("/components/founders/view-emp?team=Housekeeping");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div>
          <div className={`mb-12 transition-all duration-700 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
            <div className="relative">
              <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome to the Founder's Dashboard</h1>
              <p className="text-gray-600 text-center text-lg mb-4">
                Overview of your organization's structure and quick access tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className={`transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Staff Count</h2>
                    <div
                      className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:rotate-180 cursor-pointer"
                      onClick={toggleStaffCount}
                    >
                      {isStaffCountOpen ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isStaffCountOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {statsCards.map((card, index) => (
                      <div
                        key={card.label}
                        className={`relative group transition-all duration-700 ${loaded && isStaffCountOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                        style={{ transitionDelay: isStaffCountOpen ? `${index * 80}ms` : "0ms" }}
                        onMouseEnter={() => setHoveredStat(card.label)}
                        onMouseLeave={() => setHoveredStat(null)}
                      >
                        <div className={`rounded-xl p-4 border-2 border-gray-200 transition-all duration-300 bg-white shadow-md hover:shadow-xl ${hoveredStat === card.label ? "scale-105" : "scale-100"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">{card.label}</p>
                              <p className="text-2xl font-bold text-blue-600 transition-all duration-300">{card.value}</p>
                            </div>

                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 transition-all duration-300">
                              <img src={card.icon} alt={card.label} className="w-8 h-8 object-contain" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-1">
              <div className={`transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                    <div
                      className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:rotate-180 cursor-pointer"
                      onClick={toggleQuickActions}
                    >
                      {isQuickActionsOpen ? <Minus className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isQuickActionsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="flex flex-row flex-wrap gap-3">
                    {/* View Employee List Button */}
                    <div
                      role="button"
                      onClick={goToEmployeeList}
                      className={`group w-full md:w-[calc(50%-0.375rem)] xl:w-full relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"} ${hoveredButton === "view" ? "scale-105" : "scale-100"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "0ms" : "0ms" }}
                      onMouseEnter={() => setHoveredButton("view")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5">View Employee List</h3>
                          <p className="text-gray-600 text-xs">Access complete directory</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tasks & Performance Button */}
                    <div
                      role="button"
                      onClick={() => router.push("/components/task-view")}
                      className={`group w-full md:w-[calc(50%-0.375rem)] xl:w-full relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"} ${hoveredButton === "tasks" ? "scale-105" : "scale-100"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "150ms" : "0ms" }}
                      onMouseEnter={() => setHoveredButton("tasks")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          <CheckSquare className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5">Tasks & Performance</h3>
                          <p className="text-gray-600 text-xs">Monitor employee tasks & metrics</p>
                        </div>
                      </div>
                    </div>

                    {/* NEW: View Bills Button */}
                    <div
                      role="button"
                      onClick={goToBillsPage}
                      className={`group w-full md:w-[calc(50%-0.375rem)] xl:w-full relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${loaded && isQuickActionsOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"} ${hoveredButton === "bills" ? "scale-105" : "scale-100"}`}
                      style={{ transitionDelay: isQuickActionsOpen ? "300ms" : "0ms" }} // Increased delay for sequential animation
                      onMouseEnter={() => setHoveredButton("bills")}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                          {/* Using the Users icon for bills as a placeholder, you might want to use a relevant icon like 'DollarSign' or 'FileText' if you have it */}
                          <Users className="w-5 h-5 text-white" /> 
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5">View Bills</h3>
                          <p className="text-gray-600 text-xs">Access financial bill records</p>
                        </div>
                      </div>
                    </div>
                    {/* END NEW BUTTON */}

                  </div>
                </div>
              </div>
            </div>
          </div> 
        </div>
      </div>
    </div>
  );
}