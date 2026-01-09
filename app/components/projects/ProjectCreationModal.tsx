"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, X, AlertCircle, Check } from "lucide-react";
import { Employee, SavedProject } from "./page";

interface ProjectCreationModalProps {
  show: boolean;
  onClose: () => void;
  employees: Employee[];
  editingProject: SavedProject | null;
  onProjectCreated: () => void;
  onProjectUpdated: () => void;
  existingProjects: SavedProject[];
}

export default function ProjectCreationModal({
  show,
  onClose,
  employees,
  editingProject,
  onProjectCreated,
  onProjectUpdated,
  existingProjects
}: ProjectCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [editingKey, setEditingKey] = useState(false);

  const [projectFormData, setProjectFormData] = useState({
    name: "",
    key: "",
    ownerId: "",
    assigneeIds: [] as string[],
    description: "",
  });

  // Initialize form when editing project changes
  useEffect(() => {
    if (editingProject) {
      setProjectFormData({
        name: editingProject.name,
        key: editingProject.key,
        ownerId: editingProject.ownerId,
        assigneeIds: editingProject.assigneeIds || [],
        description: editingProject.description || "",
      });
      setEditingKey(false);
    } else {
      setProjectFormData({
        name: "",
        key: "",
        ownerId: employees.length > 0 ? employees[0]._id : "",
        assigneeIds: [],
        description: "",
      });
    }
  }, [editingProject, employees]);

  // Auto-generate project key for new projects
  useEffect(() => {
    if (!editingProject && !editingKey && projectFormData.name) {
      const generatedKey = projectFormData.name
        .split(/\s+/)
        .filter(w => w.length > 0)
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 5);
      
      const finalKey = generatedKey.length >= 2 
        ? generatedKey 
        : (projectFormData.name.substring(0, 5).replace(/\s/g, '') + "1").toUpperCase();
      
      setProjectFormData(prev => ({ ...prev, key: finalKey }));
    }
  }, [projectFormData.name, editingKey, editingProject]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setProjectFormData({ ...projectFormData, name: newName });

    if (!newName.trim()) {
      setNameError("");
      return;
    }

    // Check for duplicate names (excluding current project if editing)
    const isDuplicate = existingProjects.some(
      (p) => p.name.toLowerCase() === newName.trim().toLowerCase() && 
             (!editingProject || p._id !== editingProject._id)
    );

    if (isDuplicate) {
      setNameError("This project name is already taken");
    } else {
      setNameError("");
    }
  };

  const toggleAssignee = (employeeId: string) => {
    setProjectFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(employeeId)
        ? prev.assigneeIds.filter(id => id !== employeeId)
        : [...prev.assigneeIds, employeeId]
    }));
  };

  const handleProjectSubmit = async () => {
    if (nameError || !projectFormData.name.trim()) return;

    setLoading(true);
    setMessage("");
    try {
      const url = editingProject ? `/api/projects/${editingProject._id}` : "/api/projects";
      const method = editingProject ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectFormData.name.trim(),
          key: projectFormData.key.toUpperCase(),
          ownerId: projectFormData.ownerId,
          assigneeIds: projectFormData.assigneeIds,
          description: projectFormData.description,
        }),
      });

      if (response.ok) {
        setMessage(`✅ Project ${editingProject ? "updated" : "created"} successfully!`);
        
        setTimeout(() => {
          if (editingProject) {
            onProjectUpdated();
          } else {
            onProjectCreated();
          }
          onClose();
        }, 1000);
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error || `Failed to ${editingProject ? "update" : "create"} project`}`);
      }
    } catch (err) {
      setMessage("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full mt-20 max-h-[70vh] overflow-hidden flex flex-col border-4 border-white">
        <div className="p-8 lg:p-12 flex-1 overflow-y-auto custom-scrollbar">
          <header className="mb-10 flex items-center justify-between">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {editingProject ? "Edit Project" : "Create Project"}
            </h1>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </header>

          {message && (
            <div className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2 font-bold ${
              message.includes("✅") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <CheckCircle2 size={16}/> {message}
            </div>
          )}

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Project Name *</label>
              <input
                className={`w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#3fa87d] focus:bg-white font-bold text-slate-900 transition-all ${nameError ? "border-red-400" : ""}`}
                placeholder="e.g. Apollo Phase 2"
                value={projectFormData.name}
                onChange={handleNameChange}
              />
              {nameError && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {nameError}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Project ID *</label>
                <button onClick={() => setEditingKey(!editingKey)} className="text-[10px] font-bold text-[#3fa87d] uppercase tracking-wider">
                  {editingKey ? "Save Key" : "Edit Key"}
                </button>
              </div>
              <input
                type="text"
                className={`w-full px-6 py-4 border-2 border-slate-100 rounded-2xl outline-none font-bold uppercase transition-all ${!editingKey ? "bg-slate-100 text-slate-400" : "bg-slate-50 focus:border-[#3fa87d] focus:bg-white"}`}
                value={projectFormData.key}
                readOnly={!editingKey}
                onChange={(e) => setProjectFormData({...projectFormData, key: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')})}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Project Lead *</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#3fa87d] focus:bg-white font-bold text-slate-900 transition-all"
                value={projectFormData.ownerId}
                onChange={(e) => setProjectFormData({ ...projectFormData, ownerId: e.target.value })}
              >
                <option value="">Select Project Lead</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* Multiple Assignees Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Team Members</label>
              <div className="max-h-48 overflow-y-auto p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                <div className="grid grid-cols-1 gap-3">
                  {employees.map(emp => (
                    <div key={emp._id} className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-xl cursor-pointer">
                      <button
                        type="button"
                        onClick={() => toggleAssignee(emp._id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          projectFormData.assigneeIds.includes(emp._id)
                            ? "bg-[#3fa87d] border-[#3fa87d] text-white"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {projectFormData.assigneeIds.includes(emp._id) && <Check size={14} />}
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-xs font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                          <p className="text-xs text-slate-500">{emp.department || "No department"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {projectFormData.assigneeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {projectFormData.assigneeIds.map(assigneeId => {
                    const assignee = employees.find(e => e._id === assigneeId);
                    return assignee ? (
                      <div key={assigneeId} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                        <div className="w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {assignee.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-700">{assignee.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleAssignee(assigneeId)}
                          className="text-slate-500 hover:text-red-500 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Description</label>
              <textarea
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#3fa87d] focus:bg-white font-bold text-slate-900 transition-all min-h-[100px]"
                placeholder="Project description (optional)"
                value={projectFormData.description}
                onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-4 bg-slate-200 text-slate-700 text-xs font-black uppercase rounded-2xl hover:bg-slate-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleProjectSubmit}
            disabled={loading || !!nameError || !projectFormData.name || !projectFormData.ownerId}
            className="px-12 py-4 bg-slate-900 text-white text-xs font-black uppercase rounded-2xl shadow-xl hover:bg-[#3fa87d] transition-all disabled:opacity-30"
          >
            {loading ? "Processing..." : editingProject ? "Update Project" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}