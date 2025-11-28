"use client";

import React, { useState } from "react";
// Assuming these component files exist in "./components/"
import Sidebar from "./components/Sidebar"; 
import EmployeeOnboard from "./components/EmployeeOnboard"; 
import EmployeeList from "./components/EmployeeList"; 
import Tasks from "./components/Tasks"; 
import LaptopPolicy from "./components/LaptopPolicy"; 
import AssetManagement from "./components/AssetManagement"; 
import Bills from "./components/Bills"; 

// --- 1. DEFINE SHARED INTERFACES ---

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
}

// Generic props that all dashboard content components MUST accept.
interface BaseContentComponentProps {
  path: string;
}

// Specific props that components like EmployeeList or AssetManagement likely need (based on the error).
// We must assume these data-fetching props are passed from the dashboard container.
interface DataComponentProps extends BaseContentComponentProps {
  assets: any[]; // Use 'any[]' or define a proper Asset interface if available
  isLoading: boolean;
  onUpdated?: (data: any) => void;
}

// --- 2. RE-ALIACED COMPONENTS WITH CORRECTED TYPES ---

// Components that only need the base path or have minimal logic (assuming these are correct)
const EmployeeOnboardComponent = EmployeeOnboard as React.FC<BaseContentComponentProps>;
const TasksComponent = Tasks as React.FC<BaseContentComponentProps>;
const BillsComponent = Bills as React.FC<BaseContentComponentProps>;

// Components that require the data props mentioned in the error (assets, isLoading, etc.)
// You must ensure these components (e.g., EmployeeList.tsx) are designed to accept these props.
const EmployeeListComponent = EmployeeList as React.FC<DataComponentProps>;
const LaptopPolicyComponent = LaptopPolicy as React.FC<DataComponentProps>;
const AssetManagementComponent = AssetManagement as React.FC<DataComponentProps>;


const menuItems: MenuItem[] = [
  { id: "onboard", icon: "👤", label: "Employee Onboard", path: "/components/it-admin/new-emp" },
  { id: "employees", icon: "📋", label: "Employee List", path: "/components/it-admin/view-emp" },
  { id: "tasks", icon: "✓", label: "Tasks", path: "/components/it-admin/view-task" },
  { id: "laptop", icon: "💻", label: "Laptop Policy", path: "/components/it-admin/laptop-policy" },
  { id: "assets", icon: "🛠️", label: "Asset Management", path: "/components/it-admin/asset-management" },
  { id: "bills", icon: "🧾", label: "Bills", path: "/components/it-admin/bills" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("onboard");
  
  // --- MOCK DATA FOR COMPONENTS REQUIRING DATA PROPS ---
  // In a real application, you would fetch this data here and pass it down.
  const [dashboardAssets, setDashboardAssets] = useState<any[]>([]); // Placeholder for fetched asset data
  const [dataIsLoading, setDataIsLoading] = useState(false); // Placeholder for loading state

  const handleAssetUpdate = (updatedAsset: any) => {
    // Logic to update the list of assets in the parent state after an edit/update
    console.log("Asset updated in dashboard:", updatedAsset);
    // setDashboardAssets(prev => prev.map(a => a._id === updatedAsset._id ? updatedAsset : a));
  };
  // --------------------------------------------------------

  const renderContent = () => {
    // Find the path string for the active tab, defaulting to a blank string if not found
    const path = menuItems.find(item => item.id === activeTab)?.path || "";

    // Props that contain shared data/handlers for data-centric components
    const dataProps = {
        path: path,
        assets: dashboardAssets,
        isLoading: dataIsLoading,
        onUpdated: handleAssetUpdate,
    };

    switch(activeTab) {
      case "onboard":
        // Base props only
        return <EmployeeOnboardComponent path={path} />;
      case "employees":
        // Data props required
        return <EmployeeListComponent {...dataProps} />;
      case "tasks":
        // Base props only
        return <TasksComponent path={path} />;
      case "laptop":
        // Data props required (for viewing policy details or printing)
        return <LaptopPolicyComponent {...dataProps} />;
      case "assets":
        // Data props required
        return <AssetManagementComponent {...dataProps} />;
      case "bills":
        // Base props only
        return <BillsComponent path={path} />;
      default:
        return <div className="p-4 text-gray-500">Select a dashboard option.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        menuItems={menuItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}