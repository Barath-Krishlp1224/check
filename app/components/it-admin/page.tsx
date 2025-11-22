"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function EmptyPage() {
  const router = useRouter();

  const handleEmployeeOnboard = () => router.push("/components/it-admin/new-emp");
  const handleSecondAction = () => router.push("/components/manager/view-emp");
  const handleViewTasks = () => router.push("/components/view-task");

  // 🆕 New buttons
  const handleLaptopPolicy = () => router.push("/components/it-admin/laptop-policy");
  const handleAssetManagement = () => router.push("/components/it-admin/asset-management");
  const handleBills = () => router.push("/components/it-admin/bills");
  const handleCreateTask = () => router.push("/components/team-lead/create-task");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-10 rounded-2xl max-w-lg w-full text-center space-y-8">

        <h1 className="text-3xl font-bold text-white">Welcome</h1>
        <p className="text-gray-300 text-sm">Select what you want to do</p>

        <div className="space-y-4">

          <button
            onClick={handleEmployeeOnboard}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            ➕ Employee Onboard
          </button>

          <button
            onClick={handleSecondAction}
            className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            📋 View Employee List
          </button>

          <button
            onClick={handleViewTasks}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            🗂️ View My Task
          </button>

          {/* 🆕 Extra Buttons */}
          <button
            onClick={handleLaptopPolicy}
            className="w-full py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            💻 Laptop Policy
          </button>

          <button
            onClick={handleAssetManagement}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            🛠️ Asset Management
          </button>

          <button
            onClick={handleBills}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            🧾 Bill Payments
          </button>

          <button
            onClick={handleCreateTask}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02]"
          >
            📝 Create Task
          </button>

        </div>
      </div>
    </div>
  );
}
