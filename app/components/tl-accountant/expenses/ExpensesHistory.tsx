// components/expenses/ExpensesHistory.tsx

import React from "react";
import { Employee, Expense } from "./types";

interface ExpensesHistoryProps {
  showHistory: boolean;
  employees: Employee[];
  historyEmployeeId: string;
  setHistoryEmployeeId: (v: string) => void;
  historyExpenses: Expense[];
  employeeHistory: Expense[];
  employeeHistoryTotal: number;
}

const ExpensesHistory: React.FC<ExpensesHistoryProps> = ({
  showHistory,
  employees,
  historyEmployeeId,
  setHistoryEmployeeId,
  historyExpenses,
  employeeHistory,
  employeeHistoryTotal,
}) => {
  if (!showHistory) return null;

  const list = historyEmployeeId ? employeeHistory : historyExpenses;

  return (
    <div className="border rounded-lg p-4 space-y-4 text-sm">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="font-semibold text-base">History (Done)</div>
        <div className="flex flex-col gap-1 max-w-xs">
          <label>Employee History</label>
          <select
            value={historyEmployeeId}
            onChange={(e) => setHistoryEmployeeId(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm outline-none"
          >
            <option value="">All</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        {historyEmployeeId && (
          <div className="text-sm">
            Total paid to this employee:{" "}
            <span className="font-semibold">
              ₹{employeeHistoryTotal.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Shop</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Total (incl. sub)</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Employee</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e) => {
              const subs = (e.subtasks || []).reduce(
                (s, sub) => s + (sub.amount || 0),
                0
              );
              const total = e.amount + subs;
              return (
                <tr key={e._id} className="border-t">
                  <td className="p-2">{e.date}</td>
                  <td className="p-2">{e.shop || "-"}</td>
                  <td className="p-2">{e.description}</td>
                  <td className="p-2 text-right">
                    ₹{total.toLocaleString()}
                  </td>
                  <td className="p-2">{e.role || "other"}</td>
                  <td className="p-2">{e.employeeName || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesHistory;
