"use client";

import React from "react";
import { type Expense, type Employee, type Role } from "./types";

interface EditExpenseFields {
  shop: string;
  description: string;
  amount: string;
  date: string;
  role: Role;
  employeeId: string;
  employeeName: string;
}

interface EditExpenseModalProps {
  editingExpense: Expense;
  editExpenseFields: EditExpenseFields;
  setEditExpenseFields: React.Dispatch<
    React.SetStateAction<EditExpenseFields>
  >;
  employees: Employee[];
  onSave: (expenseId: string, updates: Partial<EditExpenseFields>) => Promise<void>;
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
  const setField = (key: keyof EditExpenseFields, value: string) => {
    setEditExpenseFields((p) => ({ ...p, [key]: value }));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const emp = employees.find((e) => e._id === id);

    setEditExpenseFields((p) => ({
      ...p,
      employeeId: id,
      employeeName: emp?.name ?? "",
    }));
  };

  const handleSave = async () => {
    await onSave(editingExpense._id, {
      shop: editExpenseFields.shop,
      description: editExpenseFields.description,
      amount: editExpenseFields.amount,
      date: editExpenseFields.date,
      role: editExpenseFields.role,
      employeeId: editExpenseFields.employeeId || "",
      employeeName: editExpenseFields.employeeName || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        <h2 className="text-2xl font-black mb-6">Edit Expense</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Shop"
              value={editExpenseFields.shop}
              onChange={(e) => setField("shop", e.target.value)}
              className="input"
            />
            <input
              placeholder="Description"
              value={editExpenseFields.description}
              onChange={(e) => setField("description", e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Amount"
              value={editExpenseFields.amount}
              onChange={(e) => setField("amount", e.target.value)}
              className="input"
            />
            <input
              type="date"
              value={editExpenseFields.date}
              onChange={(e) => setField("date", e.target.value)}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={editExpenseFields.role}
              onChange={(e) => setField("role", e.target.value as Role)}
              className="input"
            >
              <option value="founder">Founder</option>
              <option value="manager">Manager</option>
              <option value="other">Other</option>
            </select>

            <select
              value={editExpenseFields.employeeId}
              onChange={handleEmployeeChange}
              className="input"
            >
              <option value="">None</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
