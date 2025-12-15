// components/ExpenseForm.tsx
"use client";

import React from "react";
import { type Role, type Employee } from "./types";

interface ExpenseFormProps {
  shopName: string;
  setShopName: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  role: Role;
  setRole: (r: Role) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  employees: Employee[];
  onSubmit: (e: React.FormEvent) => void;
  shops: string[];
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  shopName,
  setShopName,
  date,
  setDate,
  description,
  setDescription,
  amount,
  setAmount,
  role,
  setRole,
  selectedEmployeeId,
  setSelectedEmployeeId,
  employees,
  onSubmit,
  shops,
  onCancel,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">New Expense</h3>
        <div className="h-1 flex-1 mx-6 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"></div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shop / Vendor
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              list="shops-list"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all"
              placeholder="Enter shop name"
            />
            <datalist id="shops-list">
              {shops.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all"
              placeholder="What is this expense for?"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all bg-white cursor-pointer"
            >
              <option value="founder">Founder</option>
              <option value="manager">Manager</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Assign to Employee
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all bg-white cursor-pointer"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-lg transition-all"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;