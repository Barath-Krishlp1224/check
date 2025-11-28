// components/expenses/ExpensesFilters.tsx

import React from "react";
import { Employee, Role } from "./types";

interface ExpensesFiltersProps {
  filterRole: "all" | Role;
  setFilterRole: (v: "all" | Role) => void;
  filterStatus: "all" | "paid" | "unpaid";
  setFilterStatus: (v: "all" | "paid" | "unpaid") => void;
  filterEmployee: string;
  setFilterEmployee: (v: string) => void;
  filterFrom: string;
  setFilterFrom: (v: string) => void;
  filterTo: string;
  setFilterTo: (v: string) => void;
  filterSearch: string;
  setFilterSearch: (v: string) => void;
  filterEmployeeTotal: number;
  employees: Employee[];
  showHistory: boolean;
  setShowHistory: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const ExpensesFilters: React.FC<ExpensesFiltersProps> = ({
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  filterEmployee,
  setFilterEmployee,
  filterFrom,
  setFilterFrom,
  filterTo,
  setFilterTo,
  filterSearch,
  setFilterSearch,
  filterEmployeeTotal,
  employees,
  showHistory,
  setShowHistory,
}) => {
  return (
    <div className="border rounded-lg p-3 text-sm flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label>Role</label>
        <select
          value={filterRole}
          onChange={(e) =>
            setFilterRole(e.target.value as "all" | Role)
          }
          className="border rounded-md px-2 py-1 text-sm outline-none"
        >
          <option value="all">All</option>
          <option value="founder">Founder</option>
          <option value="manager">Manager</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label>Status</label>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as "all" | "paid" | "unpaid")
          }
          className="border rounded-md px-2 py-1 text-sm outline-none"
        >
          <option value="all">All</option>
          <option value="paid">Done</option>
          <option value="unpaid">Pending</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label>Employee</label>
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm outline-none"
        >
          <option value="all">All</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>
      {filterEmployee !== "all" && (
        <div className="flex flex-col gap-1">
          <label className="text-xs">Total Paid (Employee)</label>
          <div className="font-bold text-sm">
            ₹{filterEmployeeTotal.toLocaleString()}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label>From</label>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label>To</label>
        <input
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm outline-none"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label>Search</label>
        <input
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm outline-none"
          placeholder="Shop / description"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowHistory((s) => !s)}
        className="border px-3 py-2 rounded-md text-xs"
      >
        {showHistory ? "Hide History" : "View History"}
      </button>
    </div>
  );
};

export default ExpensesFilters;
