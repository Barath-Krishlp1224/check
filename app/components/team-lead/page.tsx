// components/EmployeesPage.tsx
"use client";

import React, { useState } from "react";
// Import the separate Sidebar component and its types/data
import Sidebar, { sidebarItems, SidebarItem } from "./components/Sidebar"; 

// Import only the remaining content components
import CreateTaskContent from "./components/CreateTaskContent";
import ViewAllTasksContent from "./components/ViewAllTasksContent";
import MyTasksContent from "./components/MyTasksContent";

// Define a type for the possible views (matching the IDs in Sidebar.tsx)
type ActiveView = "CREATE_TASK" | "VIEW_ALL_TASKS" | "MY_TASKS";

// Map the ActiveView IDs to their respective React components
const contentMap: Record<ActiveView, React.FC> = {
  CREATE_TASK: CreateTaskContent,
  VIEW_ALL_TASKS: ViewAllTasksContent,
  MY_TASKS: MyTasksContent,
};

const EmployeesPage: React.FC = () => {
  // Set the initial active view
  const [activeView, setActiveView] = useState<ActiveView>("CREATE_TASK");

  // Get the component to render based on the active view
  const ContentComponent = contentMap[activeView];

  // Helper to find the current item's label for the header (if you need it)
  const currentItem = sidebarItems.find(
    (item) => item.id === activeView
  ) as SidebarItem | undefined;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 1. Sidebar Component (Icon Navigation) */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* 2. Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* You can use currentItem?.label for a heading if needed */}

        {/* Dynamic Content Component */}
        <ContentComponent />
      </main>
    </div>
  );
};

export default EmployeesPage;
