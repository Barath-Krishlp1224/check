// components/EmployeesPage.tsx
"use client";

import React, { useState } from "react";
import Sidebar, { sidebarItems, SidebarItem } from "./components/Sidebar"; 

import CreateTaskContent from "./components/CreateTaskContent";
import ViewAllTasksContent from "./components/ViewAllTasksContent";
import MyTasksContent from "./components/MyTasksContent";
import ExpensesContent from "./components/ExpensesContent";

type ActiveView = "CREATE_TASK" | "VIEW_ALL_TASKS" | "MY_TASKS" | "EXPENSES";

const contentMap: Record<ActiveView, React.FC> = {
  CREATE_TASK: CreateTaskContent,
  VIEW_ALL_TASKS: ViewAllTasksContent,
  MY_TASKS: MyTasksContent,
  EXPENSES: ExpensesContent, // This now renders the iframe component
};

const EmployeesPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>("CREATE_TASK");
  const ContentComponent = contentMap[activeView];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
           <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">
             {activeView.replace("_", " ")}
           </h1>
        </header>

        {/* This renders either the local components or the Expenses iframe */}
        <ContentComponent />
      </main>
    </div>
  );
};

export default EmployeesPage;