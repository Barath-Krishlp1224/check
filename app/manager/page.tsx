"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, ClipboardList, BarChart3, CheckSquare } from 'lucide-react';

// 1. Define the EmployeeStats Interface
interface EmployeeStats {
  totalEmployees: number;
  techTeamCount: number;
  accountsTeamCount: number;
  hrTeamCount: number;
  adminOpsTeamCount: number;
}

const ManagerDashboard: React.FC = () => {
  const router = useRouter();
  
  // 2. Define all necessary state variables
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    techTeamCount: 0,
    accountsTeamCount: 0,
    hrTeamCount: 0,
    adminOpsTeamCount: 0,
  });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 3. Stats Fetching Effect (Correctly placed inside the component)
  useEffect(() => {
    setLoaded(true);
    const fetchStats = async () => {
      try {
        // Assume this API endpoint exists and returns EmployeeStats
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

  // 4. Data for Stats Cards
  const statsCards = [
    { 
      label: "Total Employees", 
      value: stats.totalEmployees,
      icon: Users,
      color: "from-yellow-400 to-green-500", 
    },
    { 
      label: "Tech Team", 
      value: stats.techTeamCount,
      icon: Users, // Using Users icon for simplicity, could be Briefcase
      color: "from-yellow-400 to-green-500",
    },
    { 
      label: "Accounts Team", 
      value: stats.accountsTeamCount,
      icon: Users, // Using Users icon for simplicity, could be DollarSign
      color: "from-yellow-400 to-green-500",
    },
    { 
      label: "HR Team", 
      value: stats.hrTeamCount,
      icon: Users, // Using Users icon for simplicity, could be TrendingUp
      color: "from-yellow-400 to-green-500",
    },
    { 
      label: "Admin & Ops Team", 
      value: stats.adminOpsTeamCount,
      icon: Users, // Using Users icon for simplicity, could be Settings
      color: "from-yellow-400 to-green-500",
    },
  ];

  // Action Handlers
  const handleViewEmployees = () => router.push('/manager/view-list');
  const handleAddEmployee = () => router.push('/manager/new-emp');
  const handleViewEmployeeTasks = () => router.push('/view-task');
  const handleViewPerformance = () => router.push('/employeetasks');

  // Data for Action Cards (Kept ManagerPage style)
  const actionCards = [
    {
      id: 'view',
      title: 'View Employee List',
      icon: Users,
      onClick: handleViewEmployees,
    },
    {
      id: 'add',
      title: 'Add New Employee',
      icon: UserPlus,
      onClick: handleAddEmployee,
    },
    {
      id: 'tasks',
      title: 'View Employee Tasks',
      icon: ClipboardList,
      onClick: handleViewEmployeeTasks,
    },
    {
      id: 'performance',
      title: 'View Employee Performance',
      icon: BarChart3,
      onClick: handleViewPerformance,
    },
  ];

  return (
    <div className="min-h-screen flex items-start mt-[6%] justify-center p-6">
      <div className="max-w-7xl w-full pt-10">
        
        {/* Header Section */}
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Manager Dashboard
        </h1>
        
        {/* --- STATS GRID --- */}
        <h2 className="text-2xl font-semibold text-white mb-4">Employee Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 ${
                  loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
                onMouseEnter={() => setHoveredStat(card.label)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                {/* Gradient Left Bar (vertical) */}
                <div className={`absolute top-0 left-0 bottom-0 bg-gradient-to-b ${card.color} transition-all duration-300 ${
                  hoveredStat === card.label ? 'w-2' : 'w-1' 
                }`}></div>
                
                <div className="p-4 pl-6">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">
                      {card.label}
                    </p>
                    <div className="flex items-center justify-between">
                       <p className={`text-2xl font-bold text-gray-900 transition-all duration-300 ${
                          hoveredStat === card.label ? 'scale-[1.05] text-green-600' : ''
                        }`}>
                          {card.value}
                        </p>
                        <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- ACTION CARDS GRID --- */}
        <h2 className="text-2xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actionCards.map((card, index) => {
            const Icon = card.icon;
            const isHovered = hoveredCard === card.id;
            
            return (
              <div
                key={card.id}
                className="relative group"
                // Re-using the animation style from your original snippet
                style={{ animation: `slideUp 0.6s ease-out ${index * 0.15}s both` }} 
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <button
                  onClick={card.onClick}
                  className="w-full h-52 bg-white rounded-xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left relative overflow-hidden flex flex-col"
                >
                  {/* Animated background on hover */}
                  <div 
                    className="absolute inset-0 bg-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  
                  <div className="relative z-10">
                    {/* Icon with animation */}
                    <div className={`w-14 h-14 bg-gradient-to-br from-yellow-400 to-green-500 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                      {card.title}
                    </h3>
                    
                    {/* Animated arrow indicator */}
                    <div className={`mt-4 flex items-center text-green-600 font-medium text-sm transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
                      <span>Open</span>
                      <svg 
                        className="w-4 h-4 ml-2" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-500 opacity-10 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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

export default ManagerDashboard;