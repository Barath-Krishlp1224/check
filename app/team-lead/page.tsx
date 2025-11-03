"use client";

import React from "react";
import { useRouter } from "next/navigation";

const EmployeesPage: React.FC = () => {
  const router = useRouter();

  const buttonClasses =
    "bg-white border-2 border-black text-black px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center ">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">
          Employee Task Creation Portal
        </h1>
      </div>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-6">
        <button
          onClick={() => router.push("/team-lead/create-task")}
          // Applying the new white box and black text style
          className={buttonClasses} 
        >
          Create Task
        </button>

        <button
          onClick={() => router.push("/team-lead/assign-task")}
          // Applying the new white box and black text style
          className={buttonClasses} 
        >
          View Task
        </button>
      </div>
    </div>
  );
};

export default EmployeesPage;