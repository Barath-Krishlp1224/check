// components/expenses/utils.ts

import { Expense } from "./types";

export const INITIAL_AMOUNT_CONSTANT = 1000000;

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function isExpensePaid(exp: Pick<Expense, "paid"> | { paid?: boolean }) {
  return typeof exp.paid === "boolean" ? exp.paid : false;
}
