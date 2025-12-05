"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckSquare,
  TrendingUp,
  PlusSquare,
  List,
  CalendarCheck,
  Calendar,
  ClipboardCheck,
  FileText,
} from "lucide-react";

import StatusSidebar from "../attendance/currentday-view/page"; 

export default function AdminPage() {
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const goToEmployeeList = () => {
    router.push("/components/founders/view-emp");
  };

  const goToBillsPage = () => {
    router.push("/components/founders/bills");
  };

  const goToExpensesPage = () => {
    router.push("/components/founders/expenses");
  };

  const goToCreateTask = () => {
    router.push("/components/team-lead/create-task");
  };

  const goToMyTasks = () => {
    router.push("/components/view-task");
  };

  const goToEmpLeaves = () => {
    router.push("/components/emp-leave/approval");
  };

  const goToAttendance = () => {
    router.push("/components/attendance/allday");
  };

  const goToMarkAttendance = () => {
    router.push("/components/attendance/emp");
  };

  const actionButtons = [
    {
      id: "attendance",
      title: "Attendance",
      description: "Track daily presence",
      icon: Calendar,
      onClick: goToAttendance,
      gradient: "from-green-500 to-green-600",
    },
    {
      id: "bills",
      title: "Bills",
      description: "Financial records",
      icon: FileText,
      onClick: goToBillsPage,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      id: "create-task",
      title: "Create My Task",
      description: "Assign a new task",
      icon: PlusSquare,
      onClick: goToCreateTask,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "emp-leaves",
      title: "Employee Leaves",
      description: "Manage time-off requests",
      icon: CalendarCheck,
      onClick: goToEmpLeaves,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      id: "employee-list",
      title: "Employee List",
      description: "Complete directory",
      icon: Users,
      onClick: goToEmployeeList,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "emp-tasks",
      title: "Employee Tasks",
      description: "Monitor metrics",
      icon: CheckSquare,
      onClick: () => router.push("/components/all-tasks/task-view"),
      gradient: "from-violet-500 to-violet-600",
    },
    {
      id: "expenses",
      title: "Expenses",
      description: "Expense reports",
      icon: TrendingUp,
      onClick: goToExpensesPage,
      gradient: "from-red-500 to-red-600",
    },
    {
      id: "mark-attendance",
      title: "Mark My Attendance",
      description: "Clock in/out now",
      icon: ClipboardCheck,
      onClick: goToMarkAttendance,
      gradient: "from-teal-500 to-teal-600",
    },
    {
      id: "my-tasks",
      title: "My Tasks",
      description: "Personal task list",
      icon: List,
      onClick: goToMyTasks,
      gradient: "from-pink-500 to-pink-600",
    },
  ];

  actionButtons.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
      <div className="w-full py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div
          className={`mb-6 sm:mb-8 md:mb-12 transition-all duration-1000 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
        >
          <div className="flex flex-col items-center space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Manager's Dashboard
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl px-4">
              Manage your team with powerful tools and real-time insights
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8">
          {/* Quick Actions Section */}
          <div className="lg:col-span-8">
            <div
              className={`transition-all duration-1000 delay-200 ${
                loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
              }`}
            >
              {/* Section Header */}
              <div className="mb-4 sm:mb-6 flex justify-left">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100">
                  
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    Quick Actions
                  </h2>
                </div>
              </div>

              {/* Action Cards Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {actionButtons.map((button, index) => {
                  const Icon = button.icon;
                  return (
                    <div
                      key={button.id}
                      role="button"
                      onClick={button.onClick}
                      className={`group relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 
                        border border-gray-100 cursor-pointer overflow-hidden
                        transition-all duration-300 hover:shadow-xl hover:-translate-y-1
                        ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                        ${hoveredButton === button.id ? "scale-[1.02]" : "scale-100"}`}
                      style={{
                        transitionDelay: loaded ? `${index * 50}ms` : "0ms",
                      }}
                      onMouseEnter={() => setHoveredButton(button.id)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      {/* Gradient Background on Hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${button.gradient} opacity-0 
                        group-hover:opacity-5 transition-opacity duration-300`}></div>
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl 
                            bg-gradient-to-br ${button.gradient} 
                            flex items-center justify-center shadow-lg
                            group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          
                          {/* Text */}
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg mb-1 
                              group-hover:text-gray-800 transition-colors truncate">
                              {button.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {button.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hover Arrow Indicator */}
                      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Sidebar Section */}
          <div className="lg:col-span-4">
            <div
              className={`transition-all duration-1000 delay-300 ${
                loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
              }`}
            >
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <StatusSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}