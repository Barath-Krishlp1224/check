// components/SubExpensesSection.tsx
"use client";

import React from "react";
import { type Expense, type Employee, type Subtask, formatDate } from "./types";

interface SubExpensesSectionProps {
  parent: Expense;
  employees: Employee[];
  subTitle: string;
  setSubTitle: (v: string) => void;
  subAmount: string;
  setSubAmount: (v: string) => void;
  subDate: string;
  setSubDate: (v: string) => void;
  subEmployeeId: string;
  setSubEmployeeId: (v: string) => void;
  onAddSubtask: (e: React.FormEvent, parent: Expense) => void;
  onUpdateSubtaskStatus: (
    parentExp: Expense,
    subtaskId: string,
    isDone: boolean
  ) => void;
  onDeleteSubtask: (parentExp: Expense, subtaskId: string) => void;
  onStartEditSubtask: (parent: Expense, sub: Subtask) => void;
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
  subEmployeeId,
  setSubEmployeeId,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onDeleteSubtask,
  onStartEditSubtask,
}) => {
  return (
    <tr className="bg-gradient-to-r from-blue-50 to-teal-50">
      <td className="p-6" colSpan={10}>
        <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
          <div className="mb-6 pb-4 border-b-2 border-gray-100">
            <h4 className="text-lg font-bold text-gray-900">
              Sub Expenses for:{" "}
              <span className="text-blue-600">
                {parent.shop || parent.description}
              </span>
            </h4>
          </div>

          <form
            onSubmit={(ev) => onAddSubtask(ev, parent)}
            className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-gray-200"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Description
                </label>
                <input
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                  placeholder="Sub expense title"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Date
                </label>
                <input
                  type="date"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Employee
                </label>
                <select
                  value={subEmployeeId}
                  onChange={(e) => setSubEmployeeId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white cursor-pointer"
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

            <button
              type="submit"
              className="px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 shadow-md transition-all text-sm"
            >
              Add Sub Expense
            </button>
          </form>

          {(parent.subtasks || []).length > 0 ? (
            <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                  <tr>
                    <th className="p-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Description
                    </th>
                    <th className="p-4 text-right font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Amount
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Date
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Employee
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Status
                    </th>
                    <th className="p-4 text-left font-bold text-gray-900 uppercase tracking-wide text-xs">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parent.subtasks!.map((sub: Subtask) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <td className="p-4 text-gray-900 font-medium">
                        {sub.title}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        ₹{(sub.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDate(sub.date)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {sub.employeeName || "-"}
                      </td>
                      <td className="p-4">
                        <select
                          value={sub.done ? "done" : "pending"}
                          onChange={(e) => {
                            const newStatus = e.target.value === "done";
                            onUpdateSubtaskStatus(parent, sub.id, newStatus);
                          }}
                          className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500 bg-white cursor-pointer text-gray-900"
                        >
                          <option value="pending">Pending</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onStartEditSubtask(parent, sub)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteSubtask(parent, sub.id)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-sm font-medium">No sub expenses added yet</p>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default SubExpensesSection;