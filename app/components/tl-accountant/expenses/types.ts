// components/expenses/types.ts

export type Role = "founder" | "manager" | "other";

export interface Employee {
  _id: string;
  name: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  amount?: number;
  date?: string;
  role?: Role;
  employeeId?: string;
  employeeName?: string;
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  weekStart: string;
  shop?: string;
  paid: boolean;
  role?: Role;
  employeeId?: string;
  employeeName?: string;
  subtasks: Subtask[];
}
