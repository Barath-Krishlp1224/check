// components/expenses/ExpensesTable.tsx

import React from "react";
import { Employee, Expense, Role } from "./types";
import { isExpensePaid } from "./utils";
import SubExpensesSection from "./SubExpensesSection";

interface ExpensesTableProps {
  loading: boolean;
  error: string | null;
  filteredExpenses: Expense[];
  expenses: Expense[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;

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
  onUpdatePaidStatus: (exp: Expense, isPaid: boolean) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  loading,
  error,
  filteredExpenses,
  expandedId,
  onToggleExpand,
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
  onUpdatePaidStatus,
}) => {
  return (
    <div className="border rounded-lg overflow-x-auto">
      {loading ? (
        <div className="p-4 text-sm">Loading expenses…</div>
      ) : error ? (
        <div className="p-4 text-sm text-red-500">{error}</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Shop</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Total (incl. sub)</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td className="p-3 text-center" colSpan={10}>
                  No expenses found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp, idx) => {
                const subsTotal = (exp.subtasks || []).reduce(
                  (s, sub) => s + (sub.amount || 0),
                  0
                );
                const total = exp.amount + subsTotal;
                const paid = isExpensePaid(exp);

                return (
                  <React.Fragment key={exp._id}>
                    <tr className="border-t">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{exp.shop || "-"}</td>
                      <td className="p-2">{exp.description}</td>
                      <td className="p-2 text-right">
                        ₹{exp.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">
                        ₹{total.toLocaleString()}
                      </td>
                      <td className="p-2">{exp.date}</td>
                      <td className="p-2 capitalize">
                        {exp.role || "other"}
                      </td>
                      <td className="p-2">{exp.employeeName || "-"}</td>
                      <td className="p-2">
                        <select
                          value={paid ? "paid" : "unpaid"}
                          onChange={(e) => {
                            const newStatus = e.target.value === "paid";
                            onUpdatePaidStatus(exp, newStatus);
                          }}
                          className="border rounded-md px-2 py-1 text-xs outline-none bg-white"
                        >
                          <option value="unpaid">Pending</option>
                          <option value="paid">Done</option>
                        </select>
                      </td>
                      <td className="p-2 space-x-2">
                        <button
                          type="button"
                          className="border px-2 py-1 rounded-md text-xs"
                          onClick={() => onToggleExpand(exp._id)}
                        >
                          {expandedId === exp._id ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {expandedId === exp._id && (
                      <SubExpensesSection
                        parent={exp}
                        employees={employees}
                        subTitle={subTitle}
                        setSubTitle={setSubTitle}
                        subAmount={subAmount}
                        setSubAmount={setSubAmount}
                        subDate={subDate}
                        setSubDate={setSubDate}
                        subRole={subRole}
                        setSubRole={setSubRole}
                        subEmployeeId={subEmployeeId}
                        setSubEmployeeId={setSubEmployeeId}
                        onAddSubtask={onAddSubtask}
                        onUpdateSubtaskStatus={onUpdateSubtaskStatus}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpensesTable;
