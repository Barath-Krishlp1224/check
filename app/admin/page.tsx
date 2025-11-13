"use client";

import React, { useEffect, useState } from "react";
import { Users, CheckSquare, BarChart3, TrendingUp } from "lucide-react";

interface EmployeeStats {
  totalEmployees: number;
  techTeamCount: number;
  accountsTeamCount: number;
  hrTeamCount: number;
  adminOpsTeamCount: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    techTeamCount: 0,
    accountsTeamCount: 0,
    hrTeamCount: 0,
    adminOpsTeamCount: 0,
  });
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
      icon: Users,
      color: "from-yellow-400 to-green-500", 
      bgColor: "bg-yellow-50",
      iconBg: "bg-yellow-100"
    },
    { 
      label: "Tech Team", 
      value: stats.techTeamCount,
      icon: Users,
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    { 
      label: "Accounts Team", 
      value: stats.accountsTeamCount,
      icon: Users,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    { 
      label: "HR Team", 
      value: stats.hrTeamCount,
      icon: Users,
      color: "from-orange-400 to-red-500",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    },
    { 
      label: "Admin & Ops Team", 
      value: stats.adminOpsTeamCount,
      icon: Users,
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100"
    },
  ];

  return (
    <div className="min-h-screen ">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className={`mb-8 transition-all duration-1000 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}>
            <div className="flex items-center mt-[10%] gap-4 mb-2">
              <div>
                <h1 className="text-4xl font-bold text-white">
                  Admin Dashboard
                </h1>
                
                {/* Left-aligned, rounded underline div */}
                <div 
                  className="w-40 h-1 mt-2 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"
                ></div>
              </div>
            </div>
          </div>

          {/* Single Container with Employee Stats - Card Style */}
          <div className="max-w-xl mb-8">
            <div className={`bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 transition-all duration-1000 overflow-hidden ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {/* Header with gradient background */}
              <div className="bg-gradient-to-r from-gray-900 to-black -m-4 mb-4 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      
                      Staff Count
                    </h2>
                    
                  </div>
             
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2">
                {statsCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className={`relative group transition-all duration-500 ${
                        loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      style={{
                        transitionDelay: `${index * 100}ms`
                      }}
                      onMouseEnter={() => setHoveredStat(card.label)}
                      onMouseLeave={() => setHoveredStat(null)}
                    >
                      <div className={`relative rounded-lg p-2.5 border-2 transition-all duration-300 ${
                        hoveredStat === card.label 
                          ? 'bg-gray-800 border-gray-700 shadow-lg scale-105' 
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      }`}>
                        {/* Icon Circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300 ${
                          hoveredStat === card.label ? 'bg-gray-700' : 'bg-gray-800'
                        }`}>
                          <Icon className={`w-4 h-4 transition-all duration-300 ${
                            hoveredStat === card.label ? 'text-white scale-110' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        {/* Label and Value */}
                        <p className="text-gray-400 text-xs font-medium mb-0.5">
                          {card.label}
                        </p>
                        <p className={`text-xl font-bold transition-all duration-300 ${
                          hoveredStat === card.label ? 'text-white' : 'text-gray-300'
                        }`}>
                          {card.value}
                        </p>
                        
                        {/* Bottom gradient line on hover */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 to-gray-400 rounded-b-xl transition-all duration-300 ${
                          hoveredStat === card.label ? 'opacity-100' : 'opacity-0'
                        }`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className={`bg-white rounded-2xl shadow-xl p-8 border border-gray-100 transition-all duration-1000 delay-500 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-green-500 rounded-full"></div>
              Quick Actions
            </h2>
            
            {/* Centered the quick action buttons */}
            <div className="max-w-4xl mx-auto"> 
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* View Employee List Button */}
                <a href="/admin/view-emp" className="group">
                  <div 
                    className={`relative p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-400 transition-all duration-300 cursor-pointer ${
                      hoveredButton === 'view' ? 'bg-gradient-to-br from-yellow-50 to-green-50' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredButton('view')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-5 h-5 text-green-600 transition-all duration-300 ${
                        hoveredButton === 'view' ? 'scale-125' : ''
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">View Employee List</h3>
                        <p className="text-xs text-gray-600">Browse all employees</p>
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-300 ${
                      hoveredButton === 'view' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>
                </a>

                {/* View Employee Tasks Button */}
                <a href="/view-task" className="group">
                  <div 
                    className={`relative p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-400 transition-all duration-300 cursor-pointer ${
                      hoveredButton === 'tasks' ? 'bg-gradient-to-br from-yellow-50 to-green-50' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredButton('tasks')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className={`w-5 h-5 text-green-600 transition-all duration-300 ${
                        hoveredButton === 'tasks' ? 'scale-125' : ''
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">View Employee Tasks</h3>
                        <p className="text-xs text-gray-600">Monitor task progress</p>
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-300 ${
                      hoveredButton === 'tasks' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>
                </a>
                
                {/* View Employee Performance Button */}
                <a href="/employeetasks" className="group">
                  <div 
                    className={`relative p-4 rounded-xl border-2 border-gray-200 hover:border-yellow-400 transition-all duration-300 cursor-pointer ${
                      hoveredButton === 'performance' ? 'bg-gradient-to-br from-yellow-50 to-green-50' : 'bg-white'
                    }`}
                    onMouseEnter={() => setHoveredButton('performance')}
                    onMouseLeave={() => setHoveredButton(null)}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-5 h-5 text-green-600 transition-all duration-300 ${
                        hoveredButton === 'performance' ? 'scale-125' : ''
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">View Performance</h3>
                        <p className="text-xs text-gray-600">Analyze metrics</p>
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-green-500 transition-all duration-300 ${
                      hoveredButton === 'performance' ? 'opacity-100' : 'opacity-0'
                    }`}></div>
                  </div>
                </a>
              </div>
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}