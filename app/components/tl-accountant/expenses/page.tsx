"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  type Role,
  type Employee,
  type Subtask,
  type Expense,
  INITIAL_AMOUNT_CONSTANT,
  getWeekStart,
  isExpensePaid,
} from "./types"; // Assuming this imports your necessary types
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface InitialAmountHistoryEntry {
  amount: number;
  date: string;
}

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
      className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold text-black mb-6">Add New Expense</h3>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Shop Name</label>
          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="Enter shop or vendor name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Category</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="Enter category"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 mt-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="Enter description"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
          >
            <option value="founder">Founder</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {role === "manager" && (
        <div className="flex flex-col gap-2 max-w-xs mt-5">
          <label className="text-sm font-medium text-black">Employee</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-gray-200">
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
};

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
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-black">Filters</h3>
        <button
          type="button"
          onClick={() => setShowHistory((s) => !s)}
          className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-black"
        >
          {showHistory ? "Hide History" : "View History"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Role</label>
          <select
            value={filterRole}
            onChange={(e) =>
              setFilterRole(e.target.value as "all" | Role)
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
          >
            <option value="all">All Roles</option>
            <option value="founder">Founder</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Status</label>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "paid" | "unpaid")
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
          >
            <option value="all">All Status</option>
            <option value="paid">Done</option>
            <option value="unpaid">Pending</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Employee</label>
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">Search</label>
          <input
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
            placeholder="Shop or description..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">From Date</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-black">To Date</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
          />
        </div>

        {filterEmployee !== "all" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-black">Employee Total Paid</label>
            <div className="border border-green-200 bg-green-50 rounded-lg px-4 py-2 text-lg font-bold text-green-700">
              ₹{filterEmployeeTotal.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface WalletStats {
  spent: number;
  pending: number;
  remaining: number;
}

interface ExpensesHeaderProps {
  initialAmount: number;
  isEditingInitialAmount: boolean;
  initialAmountInput: string;
  onInitialAmountInputChange: (value: string) => void;
  onStartEditInitialAmount: () => void;
  onCancelEditInitialAmount: () => void;
  onSaveInitialAmount: () => void;
  walletStats: WalletStats;
  initialAmountHistory: InitialAmountHistoryEntry[];
}

const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({
  initialAmount,
  isEditingInitialAmount,
  initialAmountInput,
  onInitialAmountInputChange,
  onStartEditInitialAmount,
  onCancelEditInitialAmount,
  onSaveInitialAmount,
  walletStats,
  initialAmountHistory,
}) => {
  const latestDate = initialAmountHistory[0]?.date
    ? new Date(initialAmountHistory[0].date).toLocaleDateString()
    : 'N/A';

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow lg:col-span-1">
        <div className="flex justify-between items-start mb-3">
          <div className="text-sm font-medium text-black">Initial Amount</div>
          {!isEditingInitialAmount && (
            <button
              onClick={onStartEditInitialAmount}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Edit/History
            </button>
          )}
        </div>
        {isEditingInitialAmount ? (
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-lg p-3">
              <label className="text-xs font-medium text-black block mb-1">Set New Amount (₹)</label>
              <input
                type="number"
                value={initialAmountInput}
                onChange={(e) => onInitialAmountInputChange(e.target.value)}
                className="w-full border-b border-gray-300 pb-1 text-sm outline-none focus:border-blue-500 text-black"
                placeholder="New Amount"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={onSaveInitialAmount}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEditInitialAmount}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-black"
                >
                  Cancel
                </button>
              </div>
            </div>

            {initialAmountHistory.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50 p-2">
                <p className="text-xs font-semibold text-black mb-2">History of Initial Amounts</p>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-200">
                    {initialAmountHistory.map((item, index) => (
                      <tr key={index} className={index === 0 ? "font-bold text-blue-600" : "text-gray-600"}>
                        <td className="py-1">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-1 text-right">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-black">
              ₹{initialAmount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              Set on: {latestDate}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-red-700 mb-3">Total Spent</div>
        <div className="text-2xl font-bold text-red-900">
          ₹{walletStats.spent.toLocaleString()}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-amber-700 mb-3">Pending (Others)</div>
        <div className="text-2xl font-bold text-amber-900">
          ₹{walletStats.pending.toLocaleString()}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-green-700 mb-3">Remaining Balance</div>
        <div className="text-2xl font-bold text-green-900">
          ₹{walletStats.remaining.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

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
    <tr className="bg-gray-50">
      <td className="p-6" colSpan={10}>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <form
            onSubmit={(ev) => onAddSubtask(ev, parent)}
            className="space-y-4 mb-5"
          >
            <div className="font-semibold text-sm text-black mb-4">
              Add Sub Expense for: <span className="text-blue-600">{parent.shop || parent.description}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-black">Description</label>
                <input
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                  placeholder="Sub expense title"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-black">Amount (₹)</label>
                <input
                  type="number"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-black">Date</label>
                <input
                  type="date"
                  value={subDate}
                  onChange={(e) => setSubDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-black">Role</label>
                <select
                  value={subRole}
                  onChange={(e) => setSubRole(e.target.value as Role)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
                >
                  <option value="founder">Founder</option>
                  <option value="manager">Manager</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {subRole === "manager" && (
              <div className="flex flex-col gap-2 max-w-xs">
                <label className="text-xs font-medium text-black">Employee</label>
                <select
                  value={subEmployeeId}
                  onChange={(e) => setSubEmployeeId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white cursor-pointer text-black"
                >
                  <option value="">Select Employee</option>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              Save Sub Expense
            </button>
          </form>

          {(parent.subtasks || []).length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left font-semibold text-black">Description</th>
                    <th className="p-3 text-right font-semibold text-black">Amount</th>
                    <th className="p-3 text-left font-semibold text-black">Date</th>
                    <th className="p-3 text-left font-semibold text-black">Role</th>
                    <th className="p-3 text-left font-semibold text-black">Employee</th>
                    <th className="p-3 text-left font-semibold text-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parent.subtasks.map((sub: Subtask) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-black">{sub.title}</td>
                      <td className="p-3 text-right font-medium text-black">
                        ₹{(sub.amount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-gray-600">{sub.date || "-"}</td>
                      <td className="p-3 text-gray-600 capitalize">{sub.role || "-"}</td>
                      <td className="p-3 text-gray-600">{sub.employeeName || "-"}</td>
                      <td className="p-3">
                        <select
                          value={sub.done ? "done" : "pending"}
                          onChange={(e) => {
                            const newStatus = e.target.value === "done";
                            onUpdateSubtaskStatus(parent, sub.id, newStatus);
                          }}
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-black"
                        >
                          <option value="pending">Pending</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
              No sub expenses yet.
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

interface ExpensesTableProps {
  loading: boolean;
  error: string | null;
  filteredExpenses: Expense[];
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
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {loading ? (
        <div className="p-8 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-sm">Loading expenses…</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600 bg-red-50">
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="p-4 text-left font-semibold text-black">#</th>
                <th className="p-4 text-left font-semibold text-black">Shop</th>
                <th className="p-4 text-left font-semibold text-black">Description</th>
                <th className="p-4 text-right font-semibold text-black">Amount</th>
                <th className="p-4 text-right font-semibold text-black">Total (incl. sub)</th>
                <th className="p-4 text-left font-semibold text-black">Date</th>
                <th className="p-4 text-left font-semibold text-black">Role</th>
                <th className="p-4 text-left font-semibold text-black">Employee</th>
                <th className="p-4 text-left font-semibold text-black">Status</th>
                <th className="p-4 text-left font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-gray-500" colSpan={10}>
                    No expenses found matching your criteria
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
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-gray-600">{idx + 1}</td>
                        <td className="p-4 text-black font-medium">{exp.shop || "-"}</td>
                        <td className="p-4 text-black">{exp.description}</td>
                        <td className="p-4 text-right font-medium text-black">
                          ₹{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-bold text-black">
                          ₹{total.toLocaleString()}
                        </td>
                        <td className="p-4 text-gray-600">{exp.date}</td>
                        <td className="p-4 text-gray-600 capitalize">
                          {exp.role || "other"}
                        </td>
                        <td className="p-4 text-gray-600">{exp.employeeName || "-"}</td>
                        <td className="p-4">
                          <select
                            value={paid ? "paid" : "unpaid"}
                            onChange={(e) => {
                              const newStatus = e.target.value === "paid";
                              onUpdatePaidStatus(exp, newStatus);
                            }}
                            className={`border rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-black ${
                              paid
                                ? "border-green-300 bg-green-50 text-green-700"
                                : "border-amber-300 bg-amber-50 text-amber-700"
                            }`}
                          >
                            <option value="unpaid">Pending</option>
                            <option value="paid">Done</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <button
                            type="button"
                            className="border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-black"
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
        </div>
      )}
    </div>
  );
};

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
  
  const historyListToShow = list.slice(0, 5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="font-semibold text-lg text-black">History (Completed)</div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-black">Filter by Employee</label>
          <select
            value={historyEmployeeId}
            onChange={(e) => setHistoryEmployeeId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer text-black"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
        {historyEmployeeId && (
          <div className="ml-auto">
            <div className="text-xs text-gray-600 mb-1">Total Paid to Employee</div>
            <div className="text-lg font-bold text-green-700">
              ₹{employeeHistoryTotal.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-4 text-left font-semibold text-black">Date</th>
              <th className="p-4 text-left font-semibold text-black">Shop</th>
              <th className="p-4 text-left font-semibold text-black">Description</th>
              <th className="p-4 text-right font-semibold text-black">Total (incl. sub)</th>
              <th className="p-4 text-left font-semibold text-black">Role</th>
              <th className="p-4 text-left font-semibold text-black">Employee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {historyListToShow.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-gray-500" colSpan={6}>
                  No completed expenses found
                </td>
              </tr>
            ) : (
              historyListToShow.map((e) => {
                const subs = (e.subtasks || []).reduce(
                  (s, sub) => s + (sub.amount || 0),
                  0
                );
                const total = e.amount + subs;
                return (
                  <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600">{e.date}</td>
                    <td className="p-4 text-black font-medium">{e.shop || "-"}</td>
                    <td className="p-4 text-black">{e.description}</td>
                    <td className="p-4 text-right font-bold text-black">
                      ₹{total.toLocaleString()}
                    </td>
                    <td className="p-4 text-gray-600 capitalize">{e.role || "other"}</td>
                    <td className="p-4 text-gray-600">{e.employeeName || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {list.length > 5 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing the latest 5 completed transactions.
        </div>
      )}
    </div>
  );
};

const ExpensesContent: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [initialAmountHistory, setInitialAmountHistory] = useState<InitialAmountHistoryEntry[]>(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("initialWalletAmountHistory");
      if (storedData) {
        try {
          const history = JSON.parse(storedData) as InitialAmountHistoryEntry[];
          if (Array.isArray(history) && history.length > 0) {
              return history;
          }
        } catch (e) {
        }
      }
    }
    return [{ amount: INITIAL_AMOUNT_CONSTANT, date: new Date().toISOString() }];
  });

  const initialAmount = initialAmountHistory[0]?.amount || 0; 

  const [isEditingInitialAmount, setIsEditingInitialAmount] = useState(false);
  const [initialAmountInput, setInitialAmountInput] = useState(
    initialAmount.toString()
  );
  
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [role, setRole] = useState<Role>("founder");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [subTitle, setSubTitle] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subDate, setSubDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [subRole, setSubRole] = useState<Role>("founder");
  const [subEmployeeId, setSubEmployeeId] = useState("");

  const [filterRole, setFilterRole] = useState<"all" | Role>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string>("");

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/expenses");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch");

        setExpenses(
          (json.data || []).map((e: any) => {
            const paid = typeof e.paid === "boolean" ? e.paid : false;
            const subtasks: Subtask[] = Array.isArray(e.subtasks)
              ? e.subtasks
              : [];
            return {
              ...e,
              paid,
              subtasks,
            } as Expense;
          })
        );
      } catch (err: any) {
        setError(err.message || "Failed to load expenses");
        toast.error(err.message || "Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const res = await fetch("/api/employees");
        const data = await res.json();
        const arr: Employee[] = Array.isArray(data)
          ? data
          : data.employees || [];
        setEmployees(arr);
      } catch {
      } finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleUpdateInitialAmount = () => {
    const newAmount = Number(initialAmountInput);
    if (!Number.isNaN(newAmount) && newAmount >= 0) {
      const newEntry: InitialAmountHistoryEntry = {
        amount: newAmount,
        date: new Date().toISOString(), 
      };
      
      if (newAmount !== initialAmountHistory[0]?.amount) {
          const newHistory = [newEntry, ...initialAmountHistory];
          setInitialAmountHistory(newHistory);
          
          if (typeof window !== "undefined") {
            localStorage.setItem("initialWalletAmountHistory", JSON.stringify(newHistory));
          }
          toast.success("Initial amount updated successfully!");
      }
      setIsEditingInitialAmount(false);
    } else {
      toast.error("Please enter a valid amount.");
    }
  };

  const walletStats = useMemo(() => {
    let spent = 0;
    let pending = 0;

    expenses.forEach((e) => {
      const base = e.amount;
      const subsTotal = (e.subtasks || []).reduce(
        (sum, s) => sum + (s.amount || 0),
        0
      );
      const full = base + subsTotal;

      const paid = isExpensePaid(e);

      if (paid) {
        spent += full;
      } else {
        pending += full;
      }
    });

    const remaining = initialAmount - spent;
    return { spent, pending, remaining };
  }, [expenses, initialAmount]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const paid = isExpensePaid(e);

      if (filterRole !== "all" && e.role !== filterRole) return false;

      if (filterStatus === "paid" && !paid) return false;
      if (filterStatus === "unpaid" && paid) return false;

      if (
        filterEmployee !== "all" &&
        filterEmployee &&
        e.employeeId !== filterEmployee
      )
        return false;

      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;

      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        if (
          !(
            e.description.toLowerCase().includes(s) ||
            (e.shop || "").toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [
    expenses,
    filterRole,
    filterStatus,
    filterEmployee,
    filterFrom,
    filterTo,
    filterSearch,
  ]);

  const filterEmployeeTotal = useMemo(() => {
    if (filterEmployee === "all" || !filterEmployee) return 0;

    return expenses.reduce((sum, e) => {
      if (e.employeeId !== filterEmployee || !isExpensePaid(e)) return sum;
      const base = e.amount;
      const subs = (e.subtasks || []).reduce(
        (s, sub) => s + (sub.amount || 0),
        0
      );
      return sum + base + subs;
    }, 0);
  }, [filterEmployee, expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !category.trim() || !date) {
      toast.warn("Description, category, amount, date are required.");
      return;
    }

    if (role === "manager" && !selectedEmployeeId) {
      toast.warn("Select employee for Manager role.");
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      category: category.trim(),
      date,
      weekStart: getWeekStart(date),
      shop: shopName.trim(),
      role,
      employeeId: selectedEmployeeId || undefined,
      employeeName:
        selectedEmployeeId &&
        employees.find((e) => e._id === selectedEmployeeId)?.name,
      subtasks: [],
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to add expense.");
        return;
      }

      const created: Expense = {
        ...json.data,
        paid: typeof json.data.paid === "boolean" ? json.data.paid : false,
        subtasks: Array.isArray(json.data.subtasks)
          ? json.data.subtasks
          : [],
      };

      setExpenses((prev) => [created, ...prev]);
      setShopName("");
      setDescription("");
      setCategory("General");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setRole("founder");
      setSelectedEmployeeId("");
      toast.success("Expense added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add expense.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setSubTitle("");
    setSubAmount("");
    setSubDate(new Date().toISOString().slice(0, 10));
    setSubRole("founder");
    setSubEmployeeId("");
  };

  const handleAddSubtask = async (
    e: React.FormEvent,
    parent: Expense
  ) => {
    e.preventDefault();
    if (!expandedId) return;
    if (!subTitle.trim() || !subAmount) {
      toast.warn("Sub description and amount required.");
      return;
    }

    if (subRole === "manager" && !subEmployeeId) {
      toast.warn("Select employee for Manager.");
      return;
    }

    const newSub: Subtask = {
      id: Math.random().toString(36).slice(2, 9),
      title: subTitle.trim(),
      done: subRole === "founder" || isExpensePaid(parent),
      amount: Number(subAmount),
      date: subDate,
      role: subRole,
      employeeId: subEmployeeId || undefined,
      employeeName:
        subEmployeeId &&
        employees.find((e) => e._id === subEmployeeId)?.name,
    };

    const updatedSubtasks = [newSub, ...(parent.subtasks || [])];

    const updates = {
        subtasks: updatedSubtasks,
        paid: false,
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parent._id,
          updates: updates,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to add sub expense.");
        return;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parent._id
            ? {
                ...exp,
                subtasks: updatedSubtasks,
                paid: false,
              }
            : exp
        )
      );
      setSubTitle("");
      setSubAmount("");
      setSubDate(new Date().toISOString().slice(0, 10));
      setSubRole("founder");
      setSubEmployeeId("");
      toast.success("Sub expense added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add sub expense.");
    }
  };

  const handleUpdateSubtaskStatus = async (
    parentExp: Expense,
    subtaskId: string,
    isDone: boolean
  ) => {
    const updatedSubtasks = (parentExp.subtasks || []).map((sub) =>
      sub.id === subtaskId ? { ...sub, done: isDone } : sub
    );

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parentExp._id,
          updates: {
            subtasks: updatedSubtasks,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update subtask status.");
        return;
      }
      
      const allSubtasksDone = updatedSubtasks.every(sub => sub.done);
      let newPaidStatus = parentExp.paid;
      
      if (!parentExp.paid && allSubtasksDone) {
          newPaidStatus = true;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parentExp._id
            ? { ...exp, subtasks: updatedSubtasks, paid: newPaidStatus }
            : exp
        )
      );
      
      if (newPaidStatus !== parentExp.paid) {
          await handleUpdatePaidStatus({...parentExp, subtasks: updatedSubtasks}, newPaidStatus, false);
      }
      toast.success("Sub expense status updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update subtask status.");
    }
  };
  
  const handleUpdatePaidStatus = async (exp: Expense, isPaid: boolean, updateSubtasks: boolean = true) => {
    
    const action = isPaid ? "Done" : "Pending";
    const confirmMessage = `Are you sure you want to mark the expense "${exp.description}" as ${action}?`;

    // Using toast for confirmation with a small delay for better UX flow (though a custom modal is better)
    // For a quick fix, we'll keep the native window.confirm, as it blocks execution cleanly.
    if (!window.confirm(confirmMessage)) {
      return;
    }

    let updatedSubtasks = exp.subtasks || [];
    
    if (updateSubtasks) {
        updatedSubtasks = (exp.subtasks || []).map((sub) => ({
          ...sub,
          done: isPaid ? true : sub.done,
        }));
    }

    const updates = {
      paid: isPaid,
      subtasks: updatedSubtasks,
    };

    try {
      const res = await fetch("/api/expenses", { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exp._id,
          updates,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update status.");
        return;
      }

      const updatedExpense: Expense = {
        ...exp,
        paid: isPaid,
        subtasks: updatedSubtasks,
      };

      setExpenses((prev) =>
        prev.map((e) => (e._id === exp._id ? updatedExpense : e))
      );
      toast.success(`Expense marked as ${isPaid ? 'Done' : 'Pending'}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const historyExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isExpensePaid(e))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses]
  );

  const employeeHistory = useMemo(() => {
    if (!historyEmployeeId) return [];
    return historyExpenses.filter((e) => e.employeeId === historyEmployeeId);
  }, [historyEmployeeId, historyExpenses]);

  const employeeHistoryTotal = useMemo(
    () =>
      employeeHistory.reduce((sum, e) => {
        const base = e.amount;
        const subs = (e.subtasks || []).reduce(
          (s, sub) => s + (sub.amount || 0),
          0
        );
        return sum + base + subs;
      }, 0),
    [employeeHistory]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      <div className="max-w-7xl mt-20 mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Expense Management</h1>
          <p className="text-black">Track and manage your business expenses</p>
        </div>

        <ExpensesHeader
          initialAmount={initialAmount}
          initialAmountHistory={initialAmountHistory}
          isEditingInitialAmount={isEditingInitialAmount}
          initialAmountInput={initialAmountInput}
          onInitialAmountInputChange={setInitialAmountInput}
          onStartEditInitialAmount={() => {
            setIsEditingInitialAmount(true);
            setInitialAmountInput(initialAmount.toString());
          }}
          onCancelEditInitialAmount={() => {
            setIsEditingInitialAmount(false);
            setInitialAmountInput(initialAmount.toString());
          }}
          onSaveInitialAmount={handleUpdateInitialAmount}
          walletStats={walletStats}
        />

        <ExpenseForm
          shopName={shopName}
          setShopName={setShopName}
          category={category}
          setCategory={setCategory}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          role={role}
          setRole={setRole}
          selectedEmployeeId={selectedEmployeeId}
          setSelectedEmployeeId={setSelectedEmployeeId}
          employees={employees}
          onSubmit={handleAddExpense}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ExpensesFilters
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterEmployee={filterEmployee}
              setFilterEmployee={setFilterEmployee}
              filterFrom={filterFrom}
              setFilterFrom={setFilterFrom}
              filterTo={filterTo}
              setFilterTo={setFilterTo}
              filterSearch={filterSearch}
              setFilterSearch={setFilterSearch}
              filterEmployeeTotal={filterEmployeeTotal}
              employees={employees}
              showHistory={showHistory}
              setShowHistory={setShowHistory}
            />
          </div>

          <div className="lg:col-span-2">
            <ExpensesTable
              loading={loading}
              error={error}
              filteredExpenses={filteredExpenses}
              expandedId={expandedId}
              onToggleExpand={toggleExpand}
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
              onAddSubtask={handleAddSubtask}
              onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
              onUpdatePaidStatus={handleUpdatePaidStatus}
            />
          </div>
        </div>

        <ExpensesHistory
          showHistory={showHistory}
          employees={employees}
          historyEmployeeId={historyEmployeeId}
          setHistoryEmployeeId={setHistoryEmployeeId}
          historyExpenses={historyExpenses}
          employeeHistory={employeeHistory}
          employeeHistoryTotal={employeeHistoryTotal}
        />
      </div>
    </div>
  );
};

export default ExpensesContent;