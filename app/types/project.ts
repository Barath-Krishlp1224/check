export interface Employee {
  _id: string;
  name: string;
  department?: string;
  email?: string;
  avatar?: string;
}

export interface SavedProject {
  _id: string;
  name: string;
  key: string;
  ownerId: string;
  assigneeIds: string[];
  description?: string;
  status: "Active" | "Archived" | "Completed";
  createdAt: string;
  updatedAt: string;
  visibility: "PRIVATE" | "PUBLIC";
  members: {
    userId: string;
    role: "Viewer" | "Contributor" | "Admin";
    addedAt: string;
  }[];
}

// Update Epic type to include both assigneeId (singular) and assigneeIds (plural)
export interface Epic {
  _id: string;
  epicId: string;
  name: string;
  summary: string;
  description: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Critical";
  startDate: string;
  endDate: string;
  ownerId: string;
  assigneeId?: string;       // Add singular assigneeId for backward compatibility
  assigneeIds: string[];     // Keep plural for multiple assignees
  labels: string[];
  projectId: string;
  projectName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  owner?: { _id: string; name: string };
  assignees?: Employee[];
}

export interface Task {
  _id: string;
  taskId: string;
  name: string;
  description: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Critical";
  type: "Task" | "Bug" | "Story" | "Feature";
  storyPoints?: number;
  dueDate?: string;
  assigneeId?: string;
  reporterId: string;
  epicId: string;
  projectId: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  assignee?: Employee;
  reporter?: Employee;
}