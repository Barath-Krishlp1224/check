// components/expenses/SubExpensesSection.tsx

import React from "react";
import { Employee, Expense, Role, Subtask } from "./types";

interface SubExpensesSectionProps {
  parent: Expense;
  employees: Employee[];
  subTitle: string;
  setSubTitle: (v: string) => void;
  subAmount: string;
  setSubAmount: (v: string) => void;
  subDate: string;
  setSubDate: (v: string) => void;
  subRole: Role;
  setSubRole: (v: Role) => void;
  subEmployeeId: string;
  setSubEmployeeId: (v: string) => void;
  onAddSubtask: (e: React.FormEvent, parent: Expense) => void;
  onUpdateSubtaskStatus: (
    parentExp: Expense,
    subtaskId: string,
    isDone: boolean
  ) => void;
}

const SubExpensesSection: React.FC<SubExpensesSectionProps> = ({
  parent,
  employees,
  subTitle,
  setSubTitle,
  subAmount,
  setSubAmount,
  subDate,
  setSubDate,
  subRole,
  setSubRole,
  subEmployeeId,
  setSubEmployeeId,
  onAddSubtask,
  onUpdateSubtaskStatus,
}) => {
  return (
    <tr className="border-t bg-gray-100">
      <td className="p-3" colSpan={10}>
        <form
          onSubmit={(ev) => onAddSubtask(ev, parent)}
          className="space-y-3 mb-4 text-xs"
        >
          <div className="font-semibold mb-1">
            Add Sub Expense for: {parent.shop || parent.description}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label>Description</label>
              <input
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs outline-none"
                placeholder="Sub expense title"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Amount</label>
              <input
                type="number"
                value={subAmount}
                onChange={(e) => setSubAmount(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Date</label>
              <input
                type="date"
                value={subDate}
                onChange={(e) => setSubDate(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Role</label>
              <select
                value={subRole}
                onChange={(e) => setSubRole(e.target.value as Role)}
                className="border rounded-md px-2 py-1 text-xs outline-none"
              >
                <option value="founder">Founder</option>
                <option value="manager">Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {subRole === "manager" && (
            <div className="flex flex-col gap-1 max-w-xs">
              <label>Employee</label>
              <select
                value={subEmployeeId}
                onChange={(e) => setSubEmployeeId(e.target.value)}
                className="border rounded-md px-2 py-1 text-xs outline-none"
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
            className="bg-black text-white px-3 py-1 rounded-md text-xs"
          >
            Save Sub Expense
          </button>
        </form>

        {(parent.subtasks || []).length > 0 ? (
          <table className="min-w-full text-xs border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-1 text-left">Description</th>
                <th className="p-1 text-right">Amount</th>
                <th className="p-1 text-left">Date</th>
                <th className="p-1 text-left">Role</th>
                <th className="p-1 text-left">Employee</th>
                <th className="p-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {parent.subtasks.map((sub: Subtask) => (
                <tr key={sub.id} className="border-t">
                  <td className="p-1">{sub.title}</td>
                  <td className="p-1 text-right">
                    ₹{(sub.amount || 0).toLocaleString()}
                  </td>
                  <td className="p-1">{sub.date || "-"}</td>
                  <td className="p-1">{sub.role || "-"}</td>
                  <td className="p-1">{sub.employeeName || "-"}</td>
                  <td className="p-1">
                    <select
                      value={sub.done ? "done" : "pending"}
                      onChange={(e) => {
                        const newStatus = e.target.value === "done";
                        onUpdateSubtaskStatus(parent, sub.id, newStatus);
                      }}
                      className="border rounded-md px-2 py-1 text-xs outline-none bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-xs">No sub expenses yet.</div>
        )}
      </td>
    </tr>
  );
};

export default SubExpensesSection;
