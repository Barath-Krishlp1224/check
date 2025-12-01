"use client";

import React, { useState } from "react";
import Sidebar, { ActiveView } from "./components/Sidebar";

import Dashboard from "./components/Dashboard";
import HRInfo from "./task-view/page";
import Profile from "./components/Profile";
import Attendance from "./components/Attendance";

const Page = () => {
  const [activeView, setActiveView] = useState<ActiveView>("DASHBOARD");

  const renderContent = () => {
    switch (activeView) {
      case "DASHBOARD":
        return <Dashboard />;
      case "ATTENDANCE":
        return <Attendance />;
      case "CHART":
        return <HRInfo />;
      case "PROFILE":
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 p-10 ml-20">{renderContent()}</main>
    </div>
  );
};

export default Page;
