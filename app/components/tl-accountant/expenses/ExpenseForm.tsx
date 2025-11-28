// components/expenses/ExpenseForm.tsx

import React from "react";
import { Employee, Role } from "./types";

interface ExpenseFormProps {
  shopName: string;
  setShopName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
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
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  shopName,
  setShopName,
  category,
  setCategory,
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
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 border rounded-lg p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label>Shop Name</label>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
            placeholder="Shop / Vendor"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
            placeholder="Category"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label>Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
            placeholder="Description"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
          >
            <option value="founder">Founder</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {role === "manager" && (
        <div className="flex flex-col gap-1 max-w-xs">
          <label>Employee</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm outline-none"
          >
            <option value="">Select</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded-md text-sm"
      >
        Add Expense
      </button>
    </form>
  );
};

export default ExpenseForm;
