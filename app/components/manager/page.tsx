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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const actionButtons = [
    {
      id: "attendance",
      title: "Attendance",
      description: "Track daily presence",
      icon: Calendar,
      onClick: () => router.push("/components/attendance/allday"),
      gradient: "from-green-500 to-green-600",
    },
    {
      id: "bills",
      title: "Bills",
      description: "Financial records",
      icon: FileText,
      onClick: () => router.push("/components/founders/bills"),
      gradient: "from-orange-500 to-orange-600",
    },
    {
      id: "create-task",
      title: "Create My Task",
      description: "Assign a new task",
      icon: PlusSquare,
      onClick: () => router.push("/components/team-lead/create-task"),
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "emp-leaves",
      title: "Employee Leaves",
      description: "Manage requests",
      icon: CalendarCheck,
      onClick: () => router.push("/components/emp-leave/approval"),
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      id: "employee-list",
      title: "Employee List",
      description: "Complete directory",
      icon: Users,
      onClick: () => router.push("/components/founders/view-emp"),
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
      onClick: () => router.push("/components/founders/expenses"),
      gradient: "from-red-500 to-red-600",
    },
    {
      id: "mark-attendance",
      title: "Mark My Attendance",
      description: "Clock in/out now",
      icon: ClipboardCheck,
      onClick: () => router.push("/components/attendance/emp"),
      gradient: "from-teal-500 to-teal-600",
    },
    {
      id: "my-tasks",
      title: "My Tasks",
      description: "Personal task list",
      icon: List,
      onClick: () => router.push("/components/employee"),
      gradient: "from-pink-500 to-pink-600",
    },
  ];

  actionButtons.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Column */}
          <div className={`transition-all duration-1000 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
            <div className="mb-8">
             <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight whitespace-nowrap">
  Manager&apos;s Dashboard
</h1>

            </div>

            {/* FIXED CARD: Using h-[500px] and flex-col to manage internal space */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>

              {/* FIXED SCROLL AREA: flex-1 ensures it takes all available card space */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  {actionButtons.map((button) => {
                    const Icon = button.icon;
                    return (
                      <div
                        key={button.id}
                        onClick={button.onClick}
                        className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className={`w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${button.gradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{button.title}</h3>
                          <p className="text-xs text-gray-500 truncate">{button.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={`transition-all duration-1000 delay-300 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}>
            <div className="overflow-hidden">
              <StatusSidebar />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}