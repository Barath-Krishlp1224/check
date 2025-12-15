// types.ts

export type Role = "founder" | "manager" | "other";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  amount: number;
  date?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface Expense {
  _id: string;
  shop: string;
  description: string;
  amount: number;
  date: string;
  weekStart: string;
  role: Role;
  employeeId?: string | null;
  employeeName?: string;
  paid: boolean;
  subtasks?: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  name: string;
}

export interface InitialAmountHistoryEntry {
  amount: number;
  date: string;
}

export const INITIAL_AMOUNT_CONSTANT = 500000;

/**
 * Utility function to format a date string.
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\s/g, "-");
  } catch (error) {
    return dateString;
  }
};

/**
 * Utility function to determine the start of the week (assuming Sunday as start).
 * Not strictly required but was present in the original code logic.
 */
export const getWeekStart = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day; // Adjust to Sunday (day 0)
  const weekStart = new Date(date.setDate(diff));
  return weekStart.toISOString().slice(0, 10);
};

/**
 * Determines if an expense is paid.
 * An expense is paid if its 'paid' field is true, OR if it has subtasks and ALL subtasks are 'done'.
 */
export const isExpensePaid = (expense: Expense): boolean => {
  if (expense.paid) return true;
  if (!expense.subtasks || expense.subtasks.length === 0) return false;
  return expense.subtasks.every((sub) => sub.done);
};