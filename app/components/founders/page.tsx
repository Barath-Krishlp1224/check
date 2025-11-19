"use client";

import React, { useEffect, useState } from "react";
import { Users, CheckSquare, BarChart3, Plus, Minus } from "lucide-react";

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
}

export default function AdminPage() {
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
        const data: EmployeeStats | { error: string } = await res.json();
        if (!("error" in data)) {
          setStats(data);
        } else {
          console.error("Error fetching stats:", data.error);
        }
      } catch (err) {
        console.error("Error fetching employee stats:", err);
      }
    };
    fetchStats();
  }, []);

  const statsCards = [
    {
      label: "Total Employees",
      value: stats.totalEmployees,
      icon: "/1.png",
    },
    {
      label: "Founders",
      value: stats.foundersTeamCount,
      icon: "/2.png",
    },
    {
      label: "Manager Team",
      value: stats.managerTeamCount,
      icon: "/3.png",
    },
    {
      label: "TL - Reporting Manager",
      value: stats.tlReportingManagerTeamCount,
      icon: "/4.png",
    },
    {
      label: "IT Admin Team",
      value: stats.itAdminTeamCount,
      icon: "/5.png",
    },
    {
      label: "Tech Team",
      value: stats.techTeamCount,
      icon: "/6.png",
    },
    {
      label: "Accounts Team",
      value: stats.accountsTeamCount,
      icon: "/7.png",
    },
    {
      label: "HR Team",
      value: stats.hrTeamCount,
      icon: "/8.png",
    },
    {
      label: "Admin & Ops Team",
      value: stats.adminOpsTeamCount,
      icon: "/9.png",
    },
  ];

  const firstColumnCards = statsCards.slice(0, 5);
  const secondColumnCards = statsCards.slice(5);

  const toggleStaffCount = () => {
    setIsStaffCountOpen(!isStaffCountOpen);
  };

  const toggleQuickActions = () => {
    setIsQuickActionsOpen(!isQuickActionsOpen);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`mb-8 transition-all duration-1000 ${
              loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            }`}
          >
            <div className="">
              <h1 className="text-4xl font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <div className="w-24 h-1 bg-blue-600 rounded-full"></div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div
                className={`transition-all duration-1000 ${
                  loaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                {/* Staff Count Header with Dropdown Toggle - Updated */}
                <div
                  className="mb-4 flex items-center gap-3 cursor-pointer group w-full"
                  onClick={toggleStaffCount}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">Staff Count</h2>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      {isStaffCountOpen ? (
                        <Minus className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isStaffCountOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-4">
                      {firstColumnCards.map((card, index) => (
                        <div
                          key={card.label}
                          className={`w-70 relative group transition-all duration-500 hover:scale-[1.03] ${
                            loaded && isStaffCountOpen
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-95"
                          }`}
                          style={{
                            transitionDelay: isStaffCountOpen ? `${index * 100}ms` : '0ms',
                          }}
                          onMouseEnter={() => setHoveredStat(card.label)}
                          onMouseLeave={() => setHoveredStat(null)}
                        >
                          <div className="rounded-xl p-4 border-2 transition-all duration-300 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-baseline gap-2">
                                <p className="text-gray-900 text-sm font-bold">
                                  {card.label}:
                                </p>
                                <p className="text-2xl text-black font-bold transition-all duration-300">
                                  {card.value}
                                </p>
                              </div>

                              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                                <img
                                  src={card.icon}
                                  alt={card.label}
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      {secondColumnCards.map((card, index) => (
                        <div
                          key={card.label}
                          className={`w-70 relative group transition-all duration-500 hover:scale-[1.03] ${
                            loaded && isStaffCountOpen
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-95"
                          }`}
                          style={{
                            transitionDelay: isStaffCountOpen ? `${(index + 5) * 100}ms` : '0ms',
                          }}
                          onMouseEnter={() => setHoveredStat(card.label)}
                          onMouseLeave={() => setHoveredStat(null)}
                        >
                          <div className="rounded-xl p-4 border-2 transition-all duration-300 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-baseline gap-2">
                                <p className="text-gray-900 text-sm font-bold">
                                  {card.label}:
                                </p>
                                <p className="text-2xl text-black font-bold transition-all duration-300">
                                  {card.value}
                                </p>
                              </div>

                              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300">
                                <img
                                  src={card.icon}
                                  alt={card.label}
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1 bg-white opacity-50 rounded-full"></div>

            <div className="flex-shrink-0">
              <div
                className={`transition-all duration-1000 delay-500 ${
                  loaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                {/* Quick Actions Header with Dropdown Toggle - Updated */}
                <div
                  className="mb-4 flex items-center gap-3 cursor-pointer group w-full"
                  onClick={toggleQuickActions}
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">
                      Quick Actions
                    </h2>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      {isQuickActionsOpen ? (
                        <Minus className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                  
                </div>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isQuickActionsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    <a href="/admin/view-emp" className="group">
                      <div
                        className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-500 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05] ${
                          loaded && isQuickActionsOpen
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95"
                        }`}
                        style={{
                          transitionDelay: isQuickActionsOpen ? '0ms' : '0ms',
                        }}
                        onMouseEnter={() => setHoveredButton("view")}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100">
                            <Users className="w-6 h-6 transition-all duration-300 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              View Employee List
                            </h3>
                          </div>
                        </div>
                      </div>
                    </a>

                    <a href="/components/founders/assign-task" className="group">
                      <div
                        className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-500 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05] ${
                          loaded && isQuickActionsOpen
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95"
                        }`}
                        style={{
                          transitionDelay: isQuickActionsOpen ? '100ms' : '0ms',
                        }}
                        onMouseEnter={() => setHoveredButton("tasks")}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100">
                            <CheckSquare className="w-6 h-6 transition-all duration-300 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              View Employee Tasks
                            </h3>
                          </div>
                        </div>
                      </div>
                    </a>

                    <a href="/employeetasks" className="group">
                      <div
                        className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-500 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05] ${
                          loaded && isQuickActionsOpen
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-95"
                        }`}
                        style={{
                          transitionDelay: isQuickActionsOpen ? '200ms' : '0ms',
                        }}
                        onMouseEnter={() => setHoveredButton("performance")}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100">
                            <BarChart3 className="w-6 h-6 transition-all duration-300 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm">
                              View Performance
                            </h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1 bg-white opacity-50 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}