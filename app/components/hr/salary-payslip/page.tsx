"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, Check, X, PencilLine, FileText, Loader2, Download, Eye } from 'lucide-react';
import { generatePayslip, type Staff } from './utils/payslipGenerator';

export default function SalaryPayslipPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempSalary, setTempSalary] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) {
        const sanitizedData = data.employees.map((emp: any) => ({
          ...emp,
          doj: emp.doj || new Date().toLocaleDateString(),
          bankAccount: emp.bankAccount || 'XXXXXXXXXXXX'
        }));
        setStaffList(sanitizedData);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staffList, searchQuery]);

  const saveSalary = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/employees/salary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, salary: tempSalary }),
      });
      const result = await res.json();
      if (result.success) {
        setStaffList(prev => prev.map(s => s._id === editingId ? { ...s, salary: Number(tempSalary) } : s));
        setEditingId(null);
        setShowConfirm(false);
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4">
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center">
            <h3 className="font-bold text-xl mb-6 text-black">Confirm Save?</h3>
            <div className="flex gap-3">
              <button disabled={isSaving} onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl text-black">No</button>
              <button disabled={isSaving} onClick={saveSalary} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl h-[600px] flex flex-col overflow-hidden border border-gray-200">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ArrowLeft className="w-6 h-6 text-black cursor-pointer" onClick={() => window.history.back()} />
            <h1 className="text-2xl font-black text-black">Payroll Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search employee..." className="bg-transparent outline-none text-sm w-48 text-black" />
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto space-y-4 custom-scrollbar bg-white">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Salaries</p>
            {filteredStaff.map(s => (
              <div key={s._id} className="p-5 rounded-2xl border border-gray-50 bg-white hover:border-blue-200 transition-all flex items-center justify-between shadow-sm">
                <div className="truncate mr-4">
                  <p className="font-bold text-black text-sm">{s.displayName || s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.role}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {editingId === s._id ? (
                    <div className="flex items-center gap-2">
                      <input autoFocus type="number" value={tempSalary} onChange={e => setTempSalary(e.target.value)} className="w-24 p-2 border border-blue-400 rounded-xl text-xs text-black outline-none" />
                      <button onClick={() => setShowConfirm(true)} className="bg-blue-600 text-white p-2 rounded-xl"><Check className="w-4 h-4"/></button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-100 text-black p-2 rounded-xl"><X className="w-4 h-4"/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-black text-sm">₹{(s.salary || 0).toLocaleString()}</span>
                      <div onClick={() => {setEditingId(s._id || null); setTempSalary((s.salary || 0).toString())}} className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors group">
                        <PencilLine className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="w-px bg-gray-100 h-full hidden md:block"></div>

          <div className="flex-1 p-8 bg-gray-50/50 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payslips</p>
            <div className="space-y-3">
              {filteredStaff.map(s => (
                <div key={`ps-${s._id}`} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">{s.name}</p>
                      <p className="text-[9px] text-gray-400">ID: {s.empId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => generatePayslip(s, 'view')} className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => generatePayslip(s, 'download')} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
}