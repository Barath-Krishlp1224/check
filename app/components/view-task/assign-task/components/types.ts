export interface Subtask {
  id: string | null;
  title: string;
  assigneeName: string;
  status: string;
  completion: number;
  remarks: string;
  timeSpent?: string;
  storyPoints: number;
  subtasks?: Subtask[];
  isEditing?: boolean;
  isExpanded?: boolean;
  date?: string;
}

export interface Task {
  _id: string;
  taskId: string;      // Fixed: Added this to solve ts(2339)
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
  taskTimeSpent?: string;
  taskStoryPoints: number;
  issueType?: "Epic" | "Story" | "Task" | "Bug"; // Added for Jira logic
  priority?: "Low" | "Medium" | "High" | "Critical"; // Added for Jira logic
}

export interface Employee {
  _id: string;
  name: string;
  empId?: string;
  team?: string;
}

export type SubtaskChangeHandler = (path: number[], field: keyof Subtask, value: string | number) => void;
export type SubtaskPathHandler = (path: number[]) => void;
export type SubtaskStatusChangeFunc = (subtaskId: string | null | undefined, newStatus: string) => void;