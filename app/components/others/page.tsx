"use client";

import React from "react";
import BehaviorComponent from "./BehaviorComponent";

/**
 * This page acts as a standalone route for testing or direct access.
 * We use "use client" here because we are passing function props
 * (onClose, onSave) to a Client Component.
 */
export default function OthersPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <BehaviorComponent
          employeeId="system-preview"
          employeeName="Preview User"
          onClose={() => {
            console.log("Modal Closed");
          }}
          onSave={(score) => {
            console.log("Behavior Score Updated:", score);
          }}
        />
      </div>
    </div>
  );
}