"use client";
import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar, Save, Loader2, History, 
  PlusCircle, Clock, FileText, CheckCircle, Trash2 
} from "lucide-react";

interface NoteItem {
  _id: string;
  date: string;
  content: string;
  createdAt: string;
}

const NotesPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<NoteItem[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const storedName = typeof window !== "undefined" ? localStorage.getItem("userName") || "Guest" : "Guest";

  const fetchHistory = useCallback(async (name: string) => {
    try {
      const response = await fetch(`/api/notes?userName=${encodeURIComponent(name)}`);
      const data = await response.json();
      if (data.success) setHistory(data.notes);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    setUserName(storedName);
    fetchHistory(storedName);
  }, [fetchHistory, storedName]);

  const handleSave = async () => {
    if (!userName || userName === "Guest") {
      alert("User not identified");
      return;
    }
    if (!note.trim()) {
      alert("Cannot save empty note");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeNoteId, userName, date: selectedDate, content: note }),
      });

      const data = await res.json();
      if (data.success) {
        if (!activeNoteId) setNote("");
        fetchHistory(userName);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(id);
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (activeNoteId === id) handleNewDraft();
        fetchHistory(userName);
      }
    } catch (err) {
      alert("Delete failed");
    }
    setShowDeleteConfirm(null);
  };

  const handleNewDraft = () => {
    setNote("");
    setActiveNoteId(null);
    setSelectedDate(today);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="bg-red-50 p-3 rounded-full">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Delete this note?</h3>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER */}
      <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2.5 rounded-xl shadow-md">
            <Calendar className="w-5 h-5" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold bg-transparent outline-none cursor-pointer text-white"
            />
          </div>
          {activeNoteId && (
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Editing Mode</span>
            </div>
          )}
        </div>
        <button onClick={handleNewDraft} className="flex items-center gap-2 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all font-semibold">
          <PlusCircle className="w-4 h-4" /> New Note
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-7xl w-full mx-auto gap-6 p-6">
        {/* EDITOR */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 flex-1 flex flex-col">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind today? Start writing..."
              className="flex-1 w-full resize-none outline-none text-base text-slate-700 leading-relaxed bg-transparent placeholder:text-slate-400"
            />
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleSave}
              disabled={isSaving || !note.trim()}
              className={`w-full ${activeNoteId ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'} disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {activeNoteId ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 text-sm font-bold text-slate-600 border-b border-slate-200 flex items-center gap-3 uppercase tracking-wide bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
            <History className="w-5 h-5 text-indigo-600" /> Recent Notes
          </div>
          
          <div className="overflow-y-auto flex-1">
            {history.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center text-slate-300">
                <FileText className="w-16 h-16 mb-4" />
                <span className="text-sm font-medium">No notes yet</span>
                <span className="text-xs mt-1">Start by creating your first note</span>
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item._id}
                  onClick={() => { 
                    setNote(item.content); 
                    setSelectedDate(item.date); 
                    setActiveNoteId(item._id); 
                  }}
                  className={`p-5 text-left border-b border-slate-100 transition-all flex flex-col gap-2 cursor-pointer group relative ${activeNoteId === item._id ? 'bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 tracking-wide">{item.date}</span>
                    <div className="flex items-center gap-2">
                      {activeNoteId === item._id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                      <button 
                        onClick={(e) => handleDeleteRequest(e, item._id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;