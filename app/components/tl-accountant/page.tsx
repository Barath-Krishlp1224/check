// components/EmployeesPage.tsx
"use client";

import React, { useState } from "react";
// Import the separate Sidebar component and its types/data
import Sidebar, { sidebarItems, SidebarItem } from "./components/Sidebar"; 

// Import all four content components
import CreateTaskContent from "./components/CreateTaskContent";
import ViewAllTasksContent from "./components/ViewAllTasksContent";
import MyTasksContent from "./components/MyTasksContent";
import ExpensesContent from "./components/ExpensesContent";

// Define a type for the possible views (matching the IDs in Sidebar.tsx)
type ActiveView = "CREATE_TASK" | "VIEW_ALL_TASKS" | "MY_TASKS" | "EXPENSES";

// Map the ActiveView IDs to their respective React components
const contentMap: Record<ActiveView, React.FC> = {
  CREATE_TASK: CreateTaskContent,
  VIEW_ALL_TASKS: ViewAllTasksContent,
  MY_TASKS: MyTasksContent,
  EXPENSES: ExpensesContent,
};

const EmployeesPage: React.FC = () => {
  // Set the initial active view
  const [activeView, setActiveView] = useState<ActiveView>("CREATE_TASK");

  // Get the component to render based on the active view
  const ContentComponent = contentMap[activeView];

  // Helper to find the current item's label for the header
  const currentItem = sidebarItems.find(item => item.id === activeView) as SidebarItem;

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* 1. Sidebar Component (Icon Navigation) */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* 2. Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        
   

        {/* Dynamic Content Component */}
        {/* Renders the selected content component (CreateTaskContent, ViewAllTasksContent, etc.) */}
        <ContentComponent />
      </main>
    </div>
  );
};

export default EmployeesPage;