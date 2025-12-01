// app/components/task-view/components/types.ts
// Single source of truth for Task / Subtask across table, modal, board, chart, aggregation, etc.

export interface Subtask {
  // ID (your main model used string | null, chart model used optional string)
  id?: string | null;

  // Main-task-facing fields (UI expects these to exist in many places)
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  remarks: string;

  // Time / effort
  timeSpent?: string | null;   // merged: works for both models
  storyPoints: number;         // full model used required; aggregation uses "|| 0" anyway

  // Nested subtasks
  subtasks?: Subtask[];

  // UI-only flags
  isEditing?: boolean;
  isExpanded?: boolean;

  // Extra metadata
  date?: string;
}

export interface Task {
  // DB id used across app
  _id: string;

  // Some places used a generic "id?" – keep it as optional
  id?: string;

  projectId: string;
  project: string;

  assigneeNames: string[];

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

  // Time / story points at task level
  taskTimeSpent?: string | null;
  taskStoryPoints: number;
}

export interface Employee {
  _id: string;
  name: string;
}

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
