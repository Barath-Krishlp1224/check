// ./components/task-view/types.ts

export interface Subtask {
  id: string | null; // Note: 'string | null'
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  remarks: string;
  subtasks?: Subtask[]; // Recursive property
  isEditing?: boolean; 
  isExpanded?: boolean; 
}

export interface Task {
  _id: string;
  projectId: string;
  project: string;
  assigneeNames: string[]; // multi-assignee support
  startDate: string;
  endDate?: string;
  dueDate: string;
  completion: number;

  // NEW: optional analytics fields used in TaskChartView
  storyPoints?: number;
  timeSpentHours?: number;

  status:
    | "Backlog"
    | "In Progress"
    | "Dev Review"
    | "Deployed in QA"
    | "Test In Progress"
    | "QA Sign Off"
    | "Deployment Stage"
    | "Pilot Test"
    | "Completed"
    | "Paused"
    | string;
  remarks?: string;
  subtasks?: Subtask[];

  // You can restrict more if you want:
  department?: "Tech" | "Accounts" | "IT Admin" | "TL Accountant" | string;
}

export interface Employee {
  _id: string;
  name: string;
  email?: string;
}

export type ViewType = "card" | "board" | "chart"; 

// --- HANDLER TYPES ---
export type SubtaskChangeHandler = (
  path: number[],
  field: keyof Subtask,
  value: string | number
) => void;

export type SubtaskPathHandler = (path: number[]) => void;

export type SubtaskStatusChangeFunc = (
  subtaskId: string | null | undefined,
  newStatus: string
) => void;

// Backwards-compatible aliases 
export type RecursiveSubtaskChangeHandler = SubtaskChangeHandler;
export type RecursiveSubtaskPathHandler = SubtaskPathHandler;
