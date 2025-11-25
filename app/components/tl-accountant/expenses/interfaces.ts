// interfaces.ts

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  amount?: number;
  date?: string;
}

export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt?: string;
  shop?: string;
  paid?: boolean;
  weekStart?: string;
  subtasks?: Subtask[];
}

export type DateFilter =
  | 'all'
  | 'yesterday'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_9_months'
  | 'last_year'
  | 'custom'
  | '';