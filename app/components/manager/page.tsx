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
  LogIn
} from "lucide-react";

// Assuming StatusSidebar is in the same directory or easily imported
import StatusSidebar from "../attendance/currentday-view/page"; 

export default function AdminPage() {
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isQuickActionsOpen] = useState(true);

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
      id: "bills",
      title: "Bills",
      description: "Financial records",
      icon: Users,
      onClick: goToBillsPage,
    },
    {
      id: "create-task",
      title: "Create My Task",
      description: "Assign a new task",
      icon: PlusSquare,
      onClick: goToCreateTask,
    },
    {
      id: "emp-leaves",
      title: "Employee Leaves",
      description: "Manage time-off requests",
      icon: CalendarCheck,
      onClick: goToEmpLeaves,
    },
    {
      id: "employee-list",
      title: "Employee List",
      description: "Complete directory",
      icon: Users,
      onClick: goToEmployeeList,
    },
    {
      id: "emp-tasks",
      title: "Employee Tasks",
      description: "Monitor metrics",
      icon: CheckSquare,
      onClick: () => router.push("/components/all-tasks/task-view"),
    },
    {
      id: "expenses",
      title: "Expenses",
      description: "Expense reports",
      icon: TrendingUp,
      onClick: goToExpensesPage,
    },
    {
      id: "mark-attendance",
      title: "Mark My Attendance",
      description: "Clock in/out now",
      icon: ClipboardCheck,
      onClick: goToMarkAttendance,
    },
    {
      id: "my-tasks",
      title: "My Tasks",
      description: "Personal task list",
      icon: List,
      onClick: goToMyTasks,
    },
    {
      id: "attendance",
      title: "Attendance",
      description: "Track daily presence",
      icon: Calendar,
      onClick: goToAttendance,
    },
  ];

  actionButtons.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div>
          <div
            className={`mb-12 transition-all duration-700 ${
              loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="relative text-center">
              <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
                Welcome to the Manager's Dashboard
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Overview of your organization's structure and quick access tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div
                className={`transition-all duration-700 delay-300 ${
                  loaded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-12"
                }`}
              >
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="2xl font-bold text-gray-900">
                      Quick Actions
                    </h2>
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    isQuickActionsOpen
                      ? "max-h-[2000px] opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-3 gap-4">
                    {actionButtons.map((button, index) => (
                      <div
                        key={button.id}
                        role="button"
                        onClick={button.onClick}
                        className={`group relative p-3 rounded-xl border-2 border-gray-200 transition-all duration-300 cursor-pointer bg-white shadow-md hover:shadow-xl ${
                          loaded && isQuickActionsOpen
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-8"
                        } ${
                          hoveredButton === button.id
                            ? "scale-[1.02]"
                            : "scale-100"
                        }`}
                        style={{
                          transitionDelay: isQuickActionsOpen
                            ? `${index * 100}ms`
                            : "0ms",
                        }}
                        onMouseEnter={() => setHoveredButton(button.id)}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-600 shadow-lg">
                            <button.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">
                              {button.title}
                            </h3>
                            <p className="text-gray-600 text-xs">
                              {button.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="xl:col-span-1">
                <div
                className={`transition-all duration-700 delay-300 ${
                  loaded
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-12"
                }`}
              >
                <StatusSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}