// types.ts
export interface Subtask {
  id: string | null;
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  remarks: string;
  subtasks?: Subtask[]; // Recursive property
  isEditing?: boolean; // UI State: Controls view/edit mode for this specific row
  isExpanded?: boolean; // UI State: Controls visibility of nested subtasks
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

// Handler types based on recursive path structure
export type SubtaskChangeHandler = (path: number[], field: keyof Subtask, value: string | number) => void;
export type SubtaskPathHandler = (path: number[]) => void;
export type SubtaskStatusChangeFunc = (subtaskId: string | null | undefined, newStatus: string) => void;

// Backwards-compatible aliases (if some files expect these names)
export type RecursiveSubtaskChangeHandler = SubtaskChangeHandler;
export type RecursiveSubtaskPathHandler = SubtaskPathHandler;
