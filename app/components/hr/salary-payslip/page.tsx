"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Search, PencilLine, FileText, 
  Loader2, Download, Eye, Landmark, CalendarDays, 
  Calculator, BadgeIndianRupee, Calendar 
} from 'lucide-react';
import { generatePayslip, type Staff } from './utils/payslipGenerator';

interface ExtendedStaff extends Staff {
  team?: string;
  ifscCode?: string;
}

export default function SalaryPayslipPage() {
  const [staffList, setStaffList] = useState<ExtendedStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtendedStaff>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPayDate, setSelectedPayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      if (data.success) {
        const sanitizedData = data.employees.map((emp: any) => ({
          ...emp,
          doj: emp.joiningDate || emp.doj,
          bankAccount: emp.accountNumber || emp.bankAccount
        }));
        setStaffList(sanitizedData);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.empId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [staffList, searchQuery]);

  const handleEditInit = (s: ExtendedStaff) => {
    setEditingId(s._id || null);
    setEditForm({ ...s });
  };

  const currentTotalEarnings = (Number(editForm.basic) || 0) + (Number(editForm.hra) || 0) + (Number(editForm.bonus) || 0) + (Number(editForm.specialAllowance) || 0);
  const currentTotalDeductions = (Number(editForm.incomeTax) || 0) + (Number(editForm.pf) || 0) + (Number(editForm.healthInsurance) || 0) + (Number(editForm.professionalTax) || 0);

  const saveEmployeeDetails = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/employees/update', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm, salary: currentTotalEarnings }),
      });
      if ((await res.json()).success) {
        setStaffList(prev => prev.map(s => s._id === editingId ? { ...s, ...editForm, salary: currentTotalEarnings } : s));
        setEditingId(null);
        setShowConfirm(false);
      }
    } catch (err) { alert("Network error"); } finally { setIsSaving(false); }
  };

  const calculateNet = (s: ExtendedStaff) => {
    const earnings = (s.basic || 0) + (s.hra || 0) + (s.bonus || 0) + (s.specialAllowance || 0);
    const deductions = (s.pf || 0) + (s.incomeTax || 0) + (s.healthInsurance || 0) + (s.professionalTax || 0);
    return earnings > 0 ? (earnings - deductions) : (s.salary || 0);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-slate-500 font-medium">Loading Payroll Data...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center backdrop-blur-md">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeIndianRupee className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-2xl mb-2 text-slate-900">Update Salary?</h3>
            <p className="text-slate-500 text-sm mb-8">This will update the breakdown and deductions for this employee.</p>
            <div className="flex gap-3">
              <button disabled={isSaving} onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-slate-700 font-bold">Cancel</button>
              <button disabled={isSaving} onClick={saveEmployeeDetails} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl bg-white mt-[5%] rounded-[3rem] shadow-2xl h-[750px] flex flex-col overflow-hidden border border-slate-200">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <button onClick={() => window.history.back()} className="p-3 hover:bg-slate-100 rounded-2xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-black text-slate-900">Payroll Hub</h1>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by name or ID..." 
              className="bg-transparent outline-none text-sm w-64 font-bold text-black placeholder:text-slate-500" 
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-[1.8] p-10 overflow-y-auto space-y-6 custom-scrollbar">
            {filteredStaff.map(s => (
              <div key={s._id} className={`p-1 rounded-[2.5rem] ${editingId === s._id ? 'bg-blue-600' : 'bg-transparent'}`}>
                <div className="p-8 rounded-[2.4rem] bg-white border border-slate-100">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">{s.name.charAt(0)}</div>
                      <div>
                        <p className="font-black text-slate-900 text-xl">{s.name}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase">{s.empId} • {s.department}</p>
                      </div>
                    </div>
                    {editingId !== s._id && (
                      <button onClick={() => handleEditInit(s)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all">
                        <PencilLine className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {editingId === s._id ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4 p-6 bg-slate-50 rounded-3xl">
                          <span className="text-[11px] font-black text-blue-600 uppercase">Earnings (₹{currentTotalEarnings})</span>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Basic" value={editForm.basic} onChange={v => setEditForm({...editForm, basic: Number(v)})} />
                            <InputField label="HRA" value={editForm.hra} onChange={v => setEditForm({...editForm, hra: Number(v)})} />
                            <InputField label="Bonus" value={editForm.bonus} onChange={v => setEditForm({...editForm, bonus: Number(v)})} />
                            <InputField label="Special" value={editForm.specialAllowance} onChange={v => setEditForm({...editForm, specialAllowance: Number(v)})} />
                          </div>
                        </div>
                        <div className="space-y-4 p-6 bg-red-50 rounded-3xl">
                          <span className="text-[11px] font-black text-red-600 uppercase">Deductions (₹{currentTotalDeductions})</span>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Income Tax" value={editForm.incomeTax} onChange={v => setEditForm({...editForm, incomeTax: Number(v)})} />
                            <InputField label="PF" value={editForm.pf} onChange={v => setEditForm({...editForm, pf: Number(v)})} />
                            <InputField label="Insurance" value={editForm.healthInsurance} onChange={v => setEditForm({...editForm, healthInsurance: Number(v)})} />
                            <InputField label="Prof. Tax" value={editForm.professionalTax} onChange={v => setEditForm({...editForm, professionalTax: Number(v)})} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowConfirm(true)} className="flex-1 bg-blue-600 text-white h-14 rounded-2xl font-black">Update Records</button>
                        <button onClick={() => setEditingId(null)} className="px-8 border h-14 rounded-2xl font-bold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl">
                      <DataBadge icon={<Landmark className="w-3.5 h-3.5"/>} label="Bank" value={s.bankAccount} />
                      <DataBadge icon={<CalendarDays className="w-3.5 h-3.5"/>} label="DOJ" value={s.doj} />
                      <DataBadge icon={<Calculator className="w-3.5 h-3.5"/>} label="Net Payable" value={`₹${calculateNet(s).toLocaleString()}`} />
                      <div className="flex flex-col items-end justify-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Gross</p>
                        <p className="text-lg font-black text-slate-900">₹{s.salary?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 p-10 bg-slate-50/80 border-l border-slate-100 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <h2 className="text-sm font-black text-slate-900 uppercase mb-4">Report Settings</h2>
              <div className="p-4 bg-white rounded-3xl border border-slate-200 space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <Calendar className="w-3 h-3"/> Set Payment Date
                 </label>
                 <input 
                  type="date" 
                  value={selectedPayDate} 
                  onChange={(e) => setSelectedPayDate(e.target.value)}
                  className="w-full bg-slate-50 p-2 rounded-xl text-xs font-bold outline-none border border-slate-100 text-black"
                 />
              </div>
            </div>

            <h2 className="text-sm font-black text-slate-900 uppercase mb-4">Generate Reports</h2>
            <div className="space-y-4">
              {filteredStaff.map(s => (
                <div key={`ps-${s._id}`} className="p-5 bg-white rounded-3xl border border-slate-200 flex items-center justify-between group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Net: ₹{calculateNet(s).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => generatePayslip(s, 'view', new Date(selectedPayDate))} className="p-2.5 text-slate-400 hover:text-blue-600 transition-all"><Eye className="w-5 h-5" /></button>
                    <button onClick={() => generatePayslip(s, 'download', new Date(selectedPayDate))} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all"><Download className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</label>
      <input 
        type="number" 
        value={value ?? ''} 
        onChange={e => onChange(e.target.value)} 
        placeholder="0"
        className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-300 text-black placeholder:text-slate-500" 
      />
    </div>
  );
}

function DataBadge({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</p>
      <p className="text-xs font-bold text-slate-700 truncate">{value || 'N/A'}</p>
    </div>
  );
}