"use client";

import React from "react";
import { useRouter } from "next/navigation";

const EmployeesPage: React.FC = () => {
  const router = useRouter();

  const buttonClasses =
    "bg-white border-2 border-black text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Employee Task Creation Portal
        </h1>
        <p className="text-gray-600 text-lg">
          Manage your tasks effortlessly — Create, View, and Track.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-6">
        <button
          type="button"
          onClick={() => router.push("/components/team-lead/create-task")}
          className={buttonClasses}
        >
          Create Task
        </button>

        <button
          type="button"
          onClick={() => router.push("/components/check")}
          className={buttonClasses}
        >
          View All Tasks
        </button>

        <button
          type="button"
          onClick={() => router.push("/components/view-task")}
          className={buttonClasses}
        >
          My Tasks
        </button>
      </div>
    </div>
  );
};

export default EmployeesPage;
