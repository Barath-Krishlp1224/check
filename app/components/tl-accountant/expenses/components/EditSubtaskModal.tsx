// components/EditSubtaskModal.tsx
"use client";

import React from "react";
import { type Employee } from "./types";

interface EditingSubtaskState {
  parentId: string;
  subId: string;
  title: string;
  amount: string;
  date: string;
  employeeId?: string;
}

interface EditSubtaskModalProps {
  editingSubtask: EditingSubtaskState;
  setEditingSubtask: React.Dispatch<React.SetStateAction<EditingSubtaskState | null>>;
  employees: Employee[];
  onSave: () => void;
  onCancel: () => void;
}

const EditSubtaskModal: React.FC<EditSubtaskModalProps> = ({
  editingSubtask,
  setEditingSubtask,
  employees,
  onSave,
  onCancel,
}) => {
  const setField = (key: keyof EditingSubtaskState, value: string) => {
    setEditingSubtask((p) => (p ? { ...p, [key]: value } : p));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">
          Edit Sub Expense
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Title
            </label>
            <input
              value={editingSubtask.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={editingSubtask.amount}
              onChange={(e) => setField("amount", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={editingSubtask.date}
              onChange={(e) => setField("date", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={editingSubtask.employeeId}
              onChange={(e) => setField("employeeId", e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500 bg-white"
            >
              <option value="">None</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            className="px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg transition-all"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSubtaskModal;