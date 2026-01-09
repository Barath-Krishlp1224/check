"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, ListTodo, Layers, Target,
  Users, Trash2, FolderKanban
} from "lucide-react";
import { Employee, SavedProject } from "../../types/project";

interface Epic {
  _id: string;
  epicId: string;
  name: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Critical";
  assigneeIds: string[];
  projectId: string;
}

interface Task {
  _id: string;
  name: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  projectId: string;
}

interface ProjectDetailsProps {
  selectedProject: SavedProject | null;
  employees: Employee[];
  onProjectUpdate: () => void;
}

export default function ProjectDetails({ selectedProject, employees, onProjectUpdate }: ProjectDetailsProps) {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectMetrics, setProjectMetrics] = useState({
    totalEpics: 0,
    completedEpics: 0,
    totalTasks: 0,
    completedTasks: 0,
    tasksByStatus: {
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0
    },
    epicsByPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchEpics = async (projectId: string) => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/epics?projectId=${projectId}`);
      const data = await response.json();
      if (response.ok) {
        setEpics(data);
      }
    } catch (err) {
      console.error("Failed to fetch epics:", err);
    }
  };

  const fetchTasks = async (projectId: string) => {
    if (!projectId) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle the new API response format
      let tasksArray: Task[] = [];
      if (data.success && Array.isArray(data.data)) {
        tasksArray = data.data;
      } else if (Array.isArray(data)) {
        tasksArray = data;
      }
      
      console.log('Fetched tasks:', tasksArray); // Debug log
      setTasks(tasksArray);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasks([]); // Set empty array on error
    }
  };

  const calculateProjectMetrics = () => {
    if (!selectedProject) {
      setProjectMetrics({
        totalEpics: 0,
        completedEpics: 0,
        totalTasks: 0,
        completedTasks: 0,
        tasksByStatus: { todo: 0, inProgress: 0, review: 0, done: 0 },
        epicsByPriority: { low: 0, medium: 0, high: 0, critical: 0 }
      });
      return;
    }
    
    // Safely filter epics and tasks
    const projectEpics = Array.isArray(epics) 
      ? epics.filter(e => e?.projectId === selectedProject._id)
      : [];
    
    const projectTasks = Array.isArray(tasks) 
      ? tasks.filter(t => t?.projectId === selectedProject._id)
      : [];
    
    console.log('Calculating metrics:', {
      epicsCount: epics.length,
      tasksCount: tasks.length,
      projectEpics: projectEpics.length,
      projectTasks: projectTasks.length
    }); // Debug log

    const epicsByPriority = {
      low: projectEpics.filter(e => e?.priority === "Low").length,
      medium: projectEpics.filter(e => e?.priority === "Medium").length,
      high: projectEpics.filter(e => e?.priority === "High").length,
      critical: projectEpics.filter(e => e?.priority === "Critical").length
    };

    const tasksByStatus = {
      todo: projectTasks.filter(t => t?.status === "Todo").length,
      inProgress: projectTasks.filter(t => t?.status === "In Progress").length,
      review: projectTasks.filter(t => t?.status === "Review").length,
      done: projectTasks.filter(t => t?.status === "Done").length
    };

    setProjectMetrics({
      totalEpics: projectEpics.length,
      completedEpics: projectEpics.filter(e => e?.status === "Done").length,
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t?.status === "Done").length,
      tasksByStatus,
      epicsByPriority
    });
  };

  const fetchProjectData = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchEpics(selectedProject._id),
        fetchTasks(selectedProject._id)
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData();
    } else {
      // Reset state when no project is selected
      setEpics([]);
      setTasks([]);
      setProjectMetrics({
        totalEpics: 0,
        completedEpics: 0,
        totalTasks: 0,
        completedTasks: 0,
        tasksByStatus: { todo: 0, inProgress: 0, review: 0, done: 0 },
        epicsByPriority: { low: 0, medium: 0, high: 0, critical: 0 }
      });
    }
  }, [selectedProject]);

  useEffect(() => {
    calculateProjectMetrics();
  }, [epics, tasks, selectedProject]);

  const handleAddAssignee = async (employeeId: string) => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/projects/${selectedProject._id}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });

      if (response.ok) {
        onProjectUpdate();
      }
    } catch (err) {
      console.error("Failed to add assignee:", err);
    }
  };

  const handleRemoveAssignee = async (employeeId: string) => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`/api/projects/${selectedProject._id}/assignees/${employeeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onProjectUpdate();
      }
    } catch (err) {
      console.error("Failed to remove assignee:", err);
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col">
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <FolderKanban className="text-slate-300 mb-4" size={48} />
            <p className="text-slate-400 font-bold mb-2">Select a project to view details</p>
            <p className="text-slate-400 text-sm text-center">Click on any project from the list</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Project Details</h2>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            {selectedProject.visibility}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3fa87d]"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#3fa87d] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {selectedProject.key.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-800 mb-1">{selectedProject.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                      {selectedProject.key}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Created: {new Date(selectedProject.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Metrics Dashboard */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="text-slate-600" size={16} />
                    <h4 className="text-xs font-bold text-slate-800 uppercase">Epics Overview</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">Total Epics</span>
                      <span className="text-lg font-black text-slate-900">{projectMetrics.totalEpics}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">Completed</span>
                      <span className="text-lg font-black text-green-600">{projectMetrics.completedEpics}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ 
                          width: `${projectMetrics.totalEpics > 0 
                            ? (projectMetrics.completedEpics / projectMetrics.totalEpics) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ListTodo className="text-slate-600" size={16} />
                    <h4 className="text-xs font-bold text-slate-800 uppercase">Tasks Overview</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">Total Tasks</span>
                      <span className="text-lg font-black text-slate-900">{projectMetrics.totalTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">Completed</span>
                      <span className="text-lg font-black text-green-600">{projectMetrics.completedTasks}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ 
                          width: `${projectMetrics.totalTasks > 0 
                            ? (projectMetrics.completedTasks / projectMetrics.totalTasks) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Status Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={14} /> Task Status Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { status: "todo", label: "Todo", color: "bg-slate-600", count: projectMetrics.tasksByStatus.todo },
                    { status: "inProgress", label: "In Progress", color: "bg-blue-600", count: projectMetrics.tasksByStatus.inProgress },
                    { status: "review", label: "Review", color: "bg-purple-600", count: projectMetrics.tasksByStatus.review },
                    { status: "done", label: "Done", color: "bg-green-600", count: projectMetrics.tasksByStatus.done }
                  ].map((item) => (
                    <div key={item.status} className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                        <span className="text-sm font-black text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full`}
                          style={{ 
                            width: `${projectMetrics.totalTasks > 0 
                              ? (item.count / projectMetrics.totalTasks) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Epic Priority Distribution */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Target size={14} /> Epic Priority Distribution
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { priority: "low", label: "Low", count: projectMetrics.epicsByPriority.low },
                    { priority: "medium", label: "Medium", count: projectMetrics.epicsByPriority.medium },
                    { priority: "high", label: "High", count: projectMetrics.epicsByPriority.high },
                    { priority: "critical", label: "Critical", count: projectMetrics.epicsByPriority.critical }
                  ].map((item) => (
                    <div key={item.priority} className="p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                        <span className="text-sm font-black text-slate-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Team */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users size={14} /> Project Team
                  </h4>
                  <button
                    onClick={() => {/* Open team management modal */}}
                    className="text-xs font-bold text-[#3fa87d]"
                  >
                    Manage
                  </button>
                </div>
                
                {/* Project Lead */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Project Lead</label>
                  <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">
                      {employees.find(e => e._id === selectedProject.ownerId)?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {employees.find(e => e._id === selectedProject.ownerId)?.name || "Unknown"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {employees.find(e => e._id === selectedProject.ownerId)?.department || "No department"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Team Members</label>
                  <div className={`space-y-2 ${selectedProject.assigneeIds?.length > 3 ? 'max-h-40 overflow-y-auto pr-2' : ''}`}>
                    {selectedProject.assigneeIds && selectedProject.assigneeIds.length > 0 ? (
                      selectedProject.assigneeIds.map((assigneeId) => {
                        const assignee = employees.find(e => e._id === assigneeId);
                        return assignee ? (
                          <div key={assigneeId} className="px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">
                                {assignee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{assignee.name}</p>
                                <p className="text-[10px] text-slate-500">{assignee.department || "No department"}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAssignee(assigneeId)}
                              className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                              title="Remove from team"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : null;
                      })
                    ) : (
                      <div className="px-3 py-4 bg-white border border-slate-200 rounded-xl text-center">
                        <p className="text-sm text-slate-500">No team members added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}