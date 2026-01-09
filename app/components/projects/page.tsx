// app/components/projects/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FolderKanban, Search, Calendar, PlusCircle, ChevronRight,
  Edit2, Trash2, Users, X, Target, ArrowLeft
} from "lucide-react";
import ProjectCreationModal from "./ProjectCreationModal";
import ProjectDetails from "./ProjectDetails";
import EpicsManagement from "./epics/EpicsManagement";
import TasksManagement from "./tasks/TasksManagement";
import type { Employee, SavedProject, Epic } from "@/app/types/project";

export default function ProjectCreationSystem() {
  const [loading, setLoading] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProject, setSelectedProject] = useState<SavedProject | null>(null);
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "tasks">("overview");
  
  // --- Search and Filter State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<SavedProject | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/employees")
      ]);
      const pData = await pRes.json();
      const eData = await eRes.json();
      
      setSavedProjects(Array.isArray(pData) ? pData : (pData.projects || []));
      const rawEmployees = eData.success && Array.isArray(eData.employees) ? eData.employees : [];
      
      setEmployees(rawEmployees.map((e: any) => ({
        _id: e._id,
        name: e.name || e.displayName || "Unknown",
        department: e.department || e.team || "Staff",
        email: e.email || "",
        avatar: e.avatar || ""
      })));
    } catch (err) {
      console.error("Initialization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project: SavedProject) => {
    setSelectedProject(project);
    setSelectedEpic(null);
    setViewMode("overview");
  };

  const handleEditProject = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setShowCreateModal(true);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from list
        setSavedProjects(prev => prev.filter(p => p._id !== projectId));
        // If deleted project was selected, clear selection
        if (selectedProject?._id === projectId) {
          setSelectedProject(null);
          setSelectedEpic(null);
          setViewMode("overview");
        }
      } else {
        const data = await response.json();
        alert(`Failed to delete project: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEpicClick = (epic: Epic) => {
    setSelectedEpic(epic);
    setViewMode("tasks");
  };

  const handleBackToEpics = () => {
    setSelectedEpic(null);
    setViewMode("overview");
  };

  // Filter projects
  const filteredProjects = useMemo(() => {
    return savedProjects.filter((proj) => {
      const matchesSearch = 
        proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proj.key.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDate = dateFilter 
        ? new Date(proj.createdAt).toISOString().split('T')[0] === dateFilter
        : true;

      return matchesSearch && matchesDate;
    });
  }, [savedProjects, searchQuery, dateFilter]);

  const handleProjectCreated = () => {
    fetchInitialData();
    setShowCreateModal(false);
    setEditingProject(null);
  };

  const handleProjectUpdated = () => {
    fetchInitialData();
    setShowCreateModal(false);
    setEditingProject(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-20 font-sans text-slate-900">
      <div className="max-w-7xl w-full mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Project Management</h1>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "tasks" && (
              <button
                onClick={handleBackToEpics}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Epics
              </button>
            )}
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Projects List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 h-[calc(90vh-12rem)] flex flex-col">
              {/* Toolbar */}
              <div className="mb-6 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <FolderKanban size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">Projects</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total: {savedProjects.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProject(null);
                      setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-[#3fa87d] hover:bg-[#35946d] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <PlusCircle size={14} /> New
                  </button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3fa87d] focus:bg-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-[#3fa87d] focus:bg-white transition-all"
                    />
                    {dateFilter && (
                      <button 
                        onClick={() => setDateFilter("")}
                        className="absolute -top-2 -right-2 bg-slate-200 text-slate-600 rounded-full p-1 hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects List - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {filteredProjects.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <FolderKanban className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-slate-400 font-bold text-sm">No projects found</p>
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="mt-3 text-[#3fa87d] text-xs font-bold underline"
                      >
                        Create your first project
                      </button>
                    </div>
                  ) : (
                    filteredProjects.map((proj) => (
                      <div
                        key={proj._id}
                        onClick={() => handleProjectSelect(proj)}
                        className={`p-4 border-2 rounded-2xl cursor-pointer transition-all group ${
                          selectedProject?._id === proj._id
                            ? "border-[#3fa87d] bg-[#3fa87d]/5 shadow-md"
                            : "border-slate-200 bg-white hover:border-[#3fa87d]/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md transition-colors ${
                            selectedProject?._id === proj._id ? "bg-[#3fa87d]" : "bg-slate-900 group-hover:bg-[#3fa87d]"
                          }`}>
                            {proj.key.substring(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 truncate">{proj.name}</h3>
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded-full ${
                                proj.status === "Active" ? "bg-green-100 text-green-800" :
                                proj.status === "Archived" ? "bg-gray-100 text-gray-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {proj.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-slate-500 uppercase">
                                {proj.key}
                              </span>
                              <span className="text-[8px] text-slate-300">•</span>
                              <span className="text-[9px] font-bold text-slate-500">
                                {new Date(proj.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleEditProject(proj, e)}
                              className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Project"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(proj._id, e)}
                              className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Project"
                            >
                              <Trash2 size={14} />
                            </button>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-[#3fa87d]" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMNS (2 columns) */}
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(90vh-12rem)]">
            
            {/* COLUMN 1: Project Details & Metrics */}
            <ProjectDetails 
              selectedProject={selectedProject}
              employees={employees}
              onProjectUpdate={fetchInitialData}
            />

            {/* COLUMN 2: Epics Management or Tasks Management */}
            {viewMode === "overview" ? (
              <EpicsManagement 
                selectedProject={selectedProject}
                employees={employees}
                onEpicClick={handleEpicClick}
              />
            ) : (
              <TasksManagement 
                selectedProject={selectedProject}
                selectedEpic={selectedEpic}
                employees={employees}
                onBackToEpics={handleBackToEpics}
              />
            )}
          </div>
        </div>

        {/* Project Creation/Edit Modal */}
        {showCreateModal && (
          <ProjectCreationModal
            show={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setEditingProject(null);
            }}
            employees={employees}
            editingProject={editingProject}
            onProjectCreated={handleProjectCreated}
            onProjectUpdated={handleProjectUpdated}
            existingProjects={savedProjects}
          />
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { 
          width: 6px; 
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: transparent; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #cbd5e1; 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #94a3b8; 
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}