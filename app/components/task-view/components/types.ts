// ./components/types.ts

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
  department?: "Tech" | "Accounts" | string;
}

export interface Employee {
  _id: string;
  name: string;
  email?: string;
}

export type ViewType = "card" | "board" | "chart"; 

// --- HANDLER TYPES ---
// This is the type expected by TaskModal for recursive changes:
export type SubtaskChangeHandler = (path: number[], field: keyof Subtask, value: string | number) => void;
// This is the type expected by TaskModal for recursive deletion/actions:
export type SubtaskPathHandler = (path: number[]) => void;
// This type doesn't seem to be causing errors but is included for completeness
export type SubtaskStatusChangeFunc = (subtaskId: string | null | undefined, newStatus: string) => void;

// Backwards-compatible aliases 
export type RecursiveSubtaskChangeHandler = SubtaskChangeHandler;
export type RecursiveSubtaskPathHandler = SubtaskPathHandler;