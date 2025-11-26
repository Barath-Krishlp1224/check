"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckSquare, TrendingUp } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // isQuickActionsOpen state is kept, but its toggle function is removed. 
  // It is set to true by default to ensure the content is visible.
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true); 

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
            
            <div className="xl:col-span-3"> 
              <div className={`transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>
                <div className="mb-6 flex items-center gap-4 group">
                  <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
                  </div>
                </div>

                <div className={`overflow-hidden transition-all duration-700 ease-in-out ${isQuickActionsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  
                  {/* UPDATED: Changed lg:grid-cols-5 to lg:grid-cols-4 to enforce 4 items in a row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                    
                    {/* View Employee List */}
                    <div
                      role="button"
                      onClick={goToEmployeeList}
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
                    
                    {/* Tasks & Performance */}
                    <div
                      role="button"
                      onClick={() => router.push("/components/task-view")}
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

                    {/* View Bills */}
                    <div
                      role="button"
                      onClick={goToBillsPage}
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

                    {/* View Expenses */}
                    <div
                      role="button"
                      onClick={goToExpensesPage}
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
                  </div>
                </div>
              </div>
            </div>
            <div className="xl:col-span-0"></div> 
          </div> 
        </div>
      </div>
    </div>
  );
}