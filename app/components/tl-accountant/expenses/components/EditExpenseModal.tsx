// components/EditExpenseModal.tsx
"use client";

import React from "react";
import { type Expense, type Employee, type Role } from "./types";

// NOTE: Added employeeName to the fields type
interface EditExpenseFields {
  shop: string;
  description: string;
  amount: string; // String for input field
  date: string;
  role: Role;
  employeeId: string; // ID of the selected employee
  employeeName: string; // Name of the selected employee
}

interface EditExpenseModalProps {
  editingExpense: Expense; // The original expense object
  editExpenseFields: EditExpenseFields;
  setEditExpenseFields: React.Dispatch<
    React.SetStateAction<EditExpenseFields>
  >;
  employees: Employee[];
  onSave: (expenseId: string) => Promise<void>; // Modified: Pass the ID to save function
  onCancel: () => void;
}

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  editingExpense,
  editExpenseFields,
  setEditExpenseFields,
  employees,
  onSave,
  onCancel,
}) => {
  const setField = (
    key: keyof EditExpenseFields,
    value: string
  ) => {
    setEditExpenseFields((p) => ({ ...p, [key]: value }));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEmployeeId = e.target.value;
    const selectedEmployee = employees.find(
      (emp) => emp._id === newEmployeeId
    );

    setEditExpenseFields((p) => ({
      ...p,
      employeeId: newEmployeeId,
      // Update employeeName when employeeId changes
      employeeName: selectedEmployee ? selectedEmployee.name : "",
    }));
  };

  const handleSave = () => {
    // Pass the expense ID to the parent's save handler
    onSave(editingExpense._id);
  };

  return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-black text-gray-900 mb-6">
          Edit Expense
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Shop
              </label>
              <input
                value={editExpenseFields.shop}
                onChange={(e) => setField("shop", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <input
                value={editExpenseFields.description}
                onChange={(e) => setField("description", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={editExpenseFields.amount}
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
                value={editExpenseFields.date}
                onChange={(e) => setField("date", e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Role
              </label>
              <select
                value={editExpenseFields.role}
                onChange={(e) => setField("role", e.target.value as Role)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500 bg-white"
              >
                <option value="founder">Founder</option>
                <option value="manager">Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Employee
              </label>
              <select
                value={editExpenseFields.employeeId}
                onChange={handleEmployeeChange} // Use the new handler
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
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;