// types.ts

export type Role = "founder" | "manager" | "other";

/**
 * Interface for the data structure stored in localStorage for the initial wallet amount.
 */
export interface InitialAmountData {
  amount: number;
  date: string; // ISO date string for when the amount was last set
}

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

export const INITIAL_AMOUNT_CONSTANT = 1000000;

/**
 * Calculates the start date (Monday) of the week for a given date string.
 * @param dateStr The date in 'YYYY-MM-DD' format.
 * @returns The start of the week (Monday) in 'YYYY-MM-DD' format.
 */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  // Calculate difference to get to Monday (where Monday is day 1, Sunday is day 0)
  // getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days. Otherwise, go back to Monday (1)
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

/**
 * Checks if an expense is marked as paid.
 * @param exp An object containing the paid status.
 * @returns boolean
 */
export function isExpensePaid(exp: Pick<Expense, "paid"> | { paid?: boolean }) {
  // Application logic dictates that 'paid' property directly represents status.
  return typeof exp.paid === "boolean" ? exp.paid : false;
}