"use client";

import React, { useState } from "react";

// Sidebar + content components
import EmployeeOnboard from "./components/EmployeeOnboard";
import EmployeeList from "./components/EmployeeList";
import Tasks from "../view-task/page";
import LaptopPolicy from "./components/LaptopPolicy";
import AssetManagement from "./components/AssetManagement";
import Bills from "./components/Bills";

import CreateTask from "../team-lead/create-task/page";

// --- TYPES ---

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  color: string;
}

interface BaseContentComponentProps {
  path: string;
}

interface DataComponentProps extends BaseContentComponentProps {
  assets: any[];
  isLoading: boolean;
  onUpdated?: (data: any) => void;
}

// Cast your components to the expected prop signatures
const EmployeeOnboardComponent = EmployeeOnboard as React.FC<BaseContentComponentProps>;
const TasksComponent = Tasks as React.FC<BaseContentComponentProps>;
const BillsComponent = Bills as React.FC<BaseContentComponentProps>;

const CreateTaskComponent = CreateTask as React.FC<BaseContentComponentProps>;

const EmployeeListComponent = EmployeeList as React.FC<DataComponentProps>;
const LaptopPolicyComponent = LaptopPolicy as React.FC<DataComponentProps>;
const AssetManagementComponent = AssetManagement as React.FC<DataComponentProps>;

// Sidebar menu config - reordered by attendance with professional colors
const menuItems: MenuItem[] = [
  { id: "onboard", icon: "UserPlus", label: "Add New Employee", path: "/components/it-admin/new-emp", color: "#3b82f6" }, // Blue
  { id: "employees", icon: "Users", label: "All Employee List", path: "/components/it-admin/view-emp", color: "#8b5cf6" }, // Purple
  { id: "createTask", icon: "ClipboardList", label: "Create My Task", path: "/components/team-lead/create-task", color: "#f59e0b" }, // Amber
  { id: "tasks", icon: "CheckSquare", label: "My Attendance's & Tasks", path: "/components/it-admin/view-task", color: "#10b981" }, // Emerald
  { id: "laptop", icon: "Laptop", label: "Emp Laptop Policy", path: "/components/it-admin/laptop-policy", color: "#6366f1" }, // Indigo
  { id: "assets", icon: "Package", label: "Asset Management", path: "/components/it-admin/asset-management", color: "#ec4899" }, // Pink
  { id: "bills", icon: "FileText", label: "Bills", path: "/components/it-admin/bills", color: "#14b8a6" }, // Teal
];

// Icon components mapping
const IconComponents: Record<string, React.FC<{ className?: string }>> = {
  UserPlus: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  Users: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  ClipboardList: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  CheckSquare: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Laptop: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Package: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  FileText: ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

// New Sidebar Component with hover labels and active state
function Sidebar({ 
  menuItems, 
  activeTab, 
  setActiveTab 
}: { 
  menuItems: MenuItem[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}) {
  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg p-3 z-50">
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          const IconComponent = IconComponents[item.icon];
          
          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[#3fa87d] text-white ring-2 ring-white ring-offset-2 ring-offset-gray-100' 
                    : 'bg-gray-100 hover:bg-gray-200'
                  }
                `}
                style={!isActive ? { color: item.color } : {}}
              >
                {IconComponent && <IconComponent className="w-6 h-6" />}
              </button>
              
              {/* Hover label tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("onboard");

  // You can replace these with real fetch logic
  const [dashboardAssets, setDashboardAssets] = useState<any[]>([]);
  const [dataIsLoading, setDataIsLoading] = useState(false);

  const handleAssetUpdate = (updatedAsset: any) => {
    console.log("Asset updated in dashboard:", updatedAsset);
  };

  const renderContent = () => {
    const item = menuItems.find((item) => item.id === activeTab);
    const path = item?.path || "";

    const dataProps: DataComponentProps = {
      path,
      assets: dashboardAssets,
      isLoading: dataIsLoading,
      onUpdated: handleAssetUpdate,
    };

    switch (activeTab) {
      case "onboard":
        return <EmployeeOnboardComponent path={path} />;

      case "employees":
        return <EmployeeListComponent {...dataProps} />;

      case "createTask":
        return <CreateTaskComponent path={path} />;

      case "tasks":
        return <TasksComponent path={path} />;

      case "laptop":
        return <LaptopPolicyComponent {...dataProps} />;

      case "assets":
        return <AssetManagementComponent {...dataProps} />;

      case "bills":
        return <BillsComponent path={path} />;

      default:
        return <div className="p-4 text-gray-500">Select a dashboard option.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Floating round sidebar on the left */}
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Full-width flexible content, no max-width applied */}
      <main className="flex-1 p-10 ml-24 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}