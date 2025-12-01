"use client";

import React, { useState } from "react";

// Sidebar + content components
import Sidebar from "./components/Sidebar";
import EmployeeOnboard from "./components/EmployeeOnboard";
import EmployeeList from "./components/EmployeeList";
import Tasks from "./components/Tasks";
import LaptopPolicy from "./components/LaptopPolicy";
import AssetManagement from "./components/AssetManagement";
import Bills from "./components/Bills";
import ApplyLeave from "../emp-leave/page";

// --- TYPES ---

interface MenuItem {
  id: string;
  icon: string;
  label: string;
  path: string;
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
const ApplyLeaveComponent = ApplyLeave as React.FC<BaseContentComponentProps>;

const EmployeeListComponent = EmployeeList as React.FC<DataComponentProps>;
const LaptopPolicyComponent = LaptopPolicy as React.FC<DataComponentProps>;
const AssetManagementComponent = AssetManagement as React.FC<DataComponentProps>;

// Sidebar menu config
const menuItems: MenuItem[] = [
  { id: "onboard",     icon: "👤", label: "Employee Onboard", path: "/components/it-admin/new-emp" },
  { id: "employees",   icon: "📋", label: "Employee List",    path: "/components/it-admin/view-emp" },
  { id: "tasks",       icon: "✓",  label: "Tasks",            path: "/components/it-admin/view-task" },
  { id: "laptop",      icon: "💻", label: "Laptop Policy",    path: "/components/it-admin/laptop-policy" },
  { id: "assets",      icon: "🛠️", label: "Asset Management", path: "/components/it-admin/asset-management" },
  { id: "bills",       icon: "🧾", label: "Bills",            path: "/components/it-admin/bills" },

  // New item: Apply Leave
  { id: "apply-leave", icon: "🏖️", label: "Apply Leave",      path: "/components/emp-leave" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("onboard");

  // You can replace these with real fetch logic
  const [dashboardAssets, setDashboardAssets] = useState<any[]>([]);
  const [dataIsLoading, setDataIsLoading] = useState(false);

  const handleAssetUpdate = (updatedAsset: any) => {
    console.log("Asset updated in dashboard:", updatedAsset);
    // Example update logic:
    // setDashboardAssets(prev =>
    //   prev.map(a => a._id === updatedAsset._id ? updatedAsset : a)
    // );
  };

  const renderContent = () => {
    const path = menuItems.find((item) => item.id === activeTab)?.path || "";

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

      case "tasks":
        return <TasksComponent path={path} />;

      case "laptop":
        return <LaptopPolicyComponent {...dataProps} />;

      case "assets":
        return <AssetManagementComponent {...dataProps} />;

      case "bills":
        return <BillsComponent path={path} />;

      case "apply-leave":
        // Now actually calling your leave component file
        return <ApplyLeaveComponent path={path} />;

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
