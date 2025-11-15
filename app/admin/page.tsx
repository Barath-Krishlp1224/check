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
  // Kept for consistency, though not strictly needed for just zoom/no color change
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
      icon: "/1.png", 
      color: "from-blue-400 to-blue-600", 
      bgColor: "bg-blue-950",
      iconBg: "bg-blue-900"
    },
    { 
      label: "Tech Team", 
      value: stats.techTeamCount,
      icon: "/2.png",
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-950",
      iconBg: "bg-blue-900"
    },
    { 
      label: "Accounts Team", 
      value: stats.accountsTeamCount,
      icon: "/3.png", 
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-950",
      iconBg: "bg-blue-900"
    },
    { 
      label: "HR Team", 
      value: stats.hrTeamCount,
      icon: "/4.png", 
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-950",
      iconBg: "bg-blue-900"
    },
    { 
      label: "Admin & Ops Team", 
      value: stats.adminOpsTeamCount,
      icon: "/5.png", 
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-950",
      iconBg: "bg-blue-900"
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className={`mb-8 transition-all duration-1000 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}>
           <div className="">
  <h1 className="text-4xl font-bold text-white mb-2">
    Admin Dashboard
  </h1>
  <div className="w-24 h-1 bg-blue-600 rounded-full"></div>
</div>
          </div>

          {/* Staff Count and Quick Actions - Side by Side */}
          <div className="flex gap-8">
            {/* Staff Count Section - Left Side */}
            <div className="flex-shrink-0">
              <div className={`transition-all duration-1000 ${
                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                {/* Header */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Staff Count
                  </h2>
                  <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
                </div>
                
                {/* Stats Grid - Vertical alignment, left-aligned */}
                <div className="flex flex-col gap-4">
                  {statsCards.map((card, index) => {
                    return (
                      <div
                        key={card.label}
                        className={`w-70 relative group transition-all duration-500 hover:scale-[1.03] ${ // 👈 MODIFIED: Added hover:scale-[1.03] for zoom
                          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                        style={{
                          transitionDelay: `${index * 100}ms`
                        }}
                        onMouseEnter={() => setHoveredStat(card.label)}
                        onMouseLeave={() => setHoveredStat(null)}
                      >
                        {/* ⚠️ NOTE: Removed the 'relative' div inside the card for cleaner scaling */}
                        <div className={`rounded-xl p-4 border-2 transition-all duration-300 bg-white shadow-sm`}>
                          <div className="flex items-center justify-between gap-4">
                            {/* Label and Value in Single Line */}
                            <div className="flex items-baseline gap-2">
                              <p className="text-gray-900 text-sm font-bold">
                                {card.label}:
                              </p>
                              <p className={`text-2xl text-black font-bold transition-all duration-300`}>
                                {card.value}
                              </p>
                            </div>
                            
                            {/* PNG Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300`}>
                              <img 
                                src={card.icon} 
                                alt={card.label}
                                className="w-12 h-12 object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* 💡 Vertical Separator Line Added Here */}
            <div className="w-1 bg-white opacity-50 rounded-full"></div>
            {/* 💡 End of Vertical Separator Line */}

            {/* Action Buttons Section - Right Side */}
            <div className="flex-shrink-0">
              <div className={`transition-all duration-1000 delay-500 ${
                loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                  <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
                </div>
                  
                
                <div className="flex flex-col gap-4">
                  {/* View Employee List Button */}
                  <a href="/admin/view-emp" className="group">
                    <div 
                      className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05]`} // 👈 MODIFIED: Changed hover classes to only include scale
                      onMouseEnter={() => setHoveredButton('view')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100`}> {/* 👈 MODIFIED: Fixed background color to stay blue-100 */}
                          <Users className={`w-6 h-6 transition-all duration-300 text-blue-600`} /> {/* 👈 MODIFIED: Fixed text color to stay blue-600 */}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">View Employee List</h3>
                        </div>
                      </div>
                    </div>
                  </a>

                  {/* View Employee Tasks Button */}
                  <a href="/view-task" className="group">
                    <div 
                      className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05]`} // 👈 MODIFIED: Changed hover classes to only include scale
                      onMouseEnter={() => setHoveredButton('tasks')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100`}> {/* 👈 MODIFIED: Fixed background color to stay blue-100 */}
                          <CheckSquare className={`w-6 h-6 transition-all duration-300 text-blue-600`} /> {/* 👈 MODIFIED: Fixed text color to stay blue-600 */}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">View Employee Tasks</h3>
                        </div>
                      </div>
                    </div>
                  </a>
                  
                  {/* View Employee Performance Button */}
                  <a href="/employeetasks" className="group">
                    <div 
                      className={`w-60 relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer bg-white shadow-sm border-gray-200 hover:scale-[1.05]`} // 👈 MODIFIED: Changed hover classes to only include scale
                      onMouseEnter={() => setHoveredButton('performance')}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-blue-100`}> {/* 👈 MODIFIED: Fixed background color to stay blue-100 */}
                          <BarChart3 className={`w-6 h-6 transition-all duration-300 text-blue-600`} /> {/* 👈 MODIFIED: Fixed text color to stay blue-600 */}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">View Performance</h3>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            {/* 💡 Vertical Separator Line Added Here */}
            <div className="w-1 bg-white opacity-50 rounded-full"></div>
            {/* 💡 End of Vertical Separator Line */}
          </div>
          
        </div>
      </div>
    </div>
  );
}