"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  PencilLine,
  FileText,
  Loader2,
  Download,
  Eye,
  Landmark,
  CalendarDays,
  Calculator,
  Calendar,
  Users,
  X,
  ChevronRight,
  Building2,
  UserCheck,
  BriefcaseBusiness,
  Wallet,
  ShieldCheck,
  Percent,
  TrendingUp,
  MapPin,
  CreditCard,
  Banknote,
} from "lucide-react";

import { generatePayslip, type Staff } from "./utils/payslipGenerator";

/* -------------------------------------------------------------------------- */
/* CONFIGURATION                                                              */
/* -------------------------------------------------------------------------- */
const FOUNDER_NAME = "Your Founder Name"; // Change this to the founder's exact name

/* -------------------------------------------------------------------------- */
/* EXTENDED STAFF INTERFACE                                                   */
/* -------------------------------------------------------------------------- */
interface ExtendedStaff extends Omit<Staff, "salary"> {
  _id?: string;
  team?: string;
  ifscCode?: string;
  companyName?: string;
  companyAddress?: string;
  designation?: string;
  bankName?: string;
  workLocation?: string;
  pfNumber?: string;

  // Earnings
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  bonus?: number;
  overtime?: number;

  // Deductions
  pf?: number;
  esi?: number;
  incomeTax?: number;
  professionalTax?: number;
  healthInsurance?: number;
  loanRecovery?: number;

  // Attendance
  leavePresent?: number;
  leaveAbsent?: number;
  lop?: number;

  employerPfContribution?: number;
  salary?: number; 
  netSalary?: number;
}

interface InputFieldProps {
  label: string;
  value: string | number | undefined;
  type?: string;
  icon?: React.ReactNode;
  onChange: (v: string) => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */
export default function SalaryPayslipPage() {
  const [staffList, setStaffList] = useState<ExtendedStaff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("All Teams");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedPayDate, setSelectedPayDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<ExtendedStaff | null>(null);
  const [editForm, setEditForm] = useState<Partial<ExtendedStaff>>({});

  /* ------------------------------ FETCH DATA ------------------------------ */
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/employees");
        const data = await response.json();
        if (data.success) {
          const sanitizedData = data.employees.map((emp: any) => ({
            ...emp,
            team: emp.team || emp.department || "General",
            doj: emp.joiningDate || emp.doj,
            bankAccount: emp.accountNumber || emp.bankAccount,
            companyName: "Nexora Tech Solutions Pvt. Ltd.",
            companyAddress: "Tidel Park, Chennai – 600113",
            bankName: emp.bankName || "HDFC Bank",
            overtime: emp.overtime || 0,
            leavePresent: emp.leavePresent || 0,
            leaveAbsent: emp.leaveAbsent || 0,
            lop: emp.lop || 0,
            employerPfContribution: emp.employerPfContribution || 2160,
          }));
          setStaffList(sanitizedData);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  /* ----------------------------- CALCULATIONS ----------------------------- */
  
  // 1. Get teams from list, excluding founder to keep department counts clean
  const teams = useMemo(() => {
    const listWithoutFounder = staffList.filter(s => s.name !== FOUNDER_NAME);
    const uniqueTeams = Array.from(new Set(listWithoutFounder.map((s) => s.team || "General")));
    return ["All Teams", ...uniqueTeams];
  }, [staffList]);

  // 2. Filter staff logic - EXCLUDES FOUNDER
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Exclude founder condition
      const isNotFounder = s.name.toLowerCase() !== FOUNDER_NAME.toLowerCase();
      
      const matchesTeam = selectedTeam === "All Teams" || s.team === selectedTeam;
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.empId.toLowerCase().includes(searchQuery.toLowerCase());
        
      return isNotFounder && matchesTeam && matchesSearch;
    });
  }, [staffList, selectedTeam, searchQuery]);

  const calculateTotals = (s: Partial<ExtendedStaff>) => {
    const earnings = 
      (Number(s.basic) || 0) + 
      (Number(s.hra) || 0) + 
      (Number(s.specialAllowance) || 0) + 
      (Number(s.bonus) || 0) + 
      (Number(s.overtime) || 0);
    
    const deductions = 
      (Number(s.pf) || 0) + 
      (Number(s.esi) || 0) + 
      (Number(s.incomeTax) || 0) + 
      (Number(s.professionalTax) || 0) + 
      (Number(s.healthInsurance) || 0) + 
      (Number(s.loanRecovery) || 0);
    
    return { earnings, deductions, net: earnings - deductions };
  };

  /* ------------------------------- HANDLERS ------------------------------- */
  const openEditModal = (staff: ExtendedStaff): void => {
    setEditingStaff(staff);
    setEditForm({ ...staff });
    setIsModalOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!editingStaff?._id) return;
    setIsSaving(true);
    const { earnings, net } = calculateTotals(editForm);
    
    try {
      const res = await fetch("/api/employees/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            id: editingStaff._id, 
            ...editForm, 
            salary: earnings, 
            netSalary: net 
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStaffList((prev) => prev.map((s) => (s._id === editingStaff._id ? { ...s, ...editForm, salary: earnings, netSalary: net } : s)));
        setIsModalOpen(false);
      }
    } catch (err) {
      alert("Error updating records.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
      <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Initializing Payroll Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">
        
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center mt-[10%] gap-5">
            <div className="p-4 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-200">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">Payroll Command</h1>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Nexora Tech Solutions
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-slate-200">
            <Search className="ml-3 w-5 h-5 text-slate-400" />
            <input 
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search ID or Name..."
              className="bg-transparent outline-none p-2 w-72 font-bold text-slate-700"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- SIDEBAR: TEAM SELECTION --- */}
          <aside className="lg:col-span-3 space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pl-4">Departments</h3>
            {teams.map((team) => (
              <button
                key={team}
                onClick={() => setSelectedTeam(team)}
                className={`w-full group flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 ${
                  selectedTeam === team 
                  ? "bg-slate-900 text-white shadow-2xl scale-[1.02]" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${selectedTeam === team ? "bg-slate-800" : "bg-slate-100 group-hover:bg-white"}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight">{team}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedTeam === team ? "rotate-90" : "opacity-0"}`} />
              </button>
            ))}
          </aside>

          {/* --- MAIN GRID: EMPLOYEES --- */}
          <main className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {selectedTeam} <span className="text-slate-300 ml-2">/ {filteredStaff.length} Employees</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStaff.map((staff) => (
                <div 
                  key={staff._id} 
                  onClick={() => openEditModal(staff)}
                  className="group bg-white border border-slate-200 p-8 rounded-[3rem] hover:shadow-2xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                    <PencilLine className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-900 leading-tight">{staff.name}</h4>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{staff.empId}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Settled Net</span>
                       <span className="text-xl font-black text-slate-900">₹{staff.netSalary?.toLocaleString() || "0"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* --- MODAL HUB --- */}
      {isModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-[1400px] h-[80vh] mt-[5%] rounded-[4rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            
            <div className="px-10 py-8 border-b flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white font-black text-2xl">
                  {editForm.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{editForm.name}</h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <BriefcaseBusiness className="w-4 h-4" /> {editForm.designation} • {editForm.empId}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#FBFCFE]">
                
                <Section title="Employment Basics">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Full Name" value={editForm.name} onChange={(v: string) => setEditForm({...editForm, name: v})} />
                    <InputField label="Employee ID" value={editForm.empId} onChange={(v: string) => setEditForm({...editForm, empId: v})} />
                    <InputField label="Designation" value={editForm.designation} onChange={(v: string) => setEditForm({...editForm, designation: v})} />
                    <InputField label="Team / Department" value={editForm.team} onChange={(v: string) => setEditForm({...editForm, team: v})} />
                    <InputField label="Joining Date" type="date" value={editForm.doj} onChange={(v: string) => setEditForm({...editForm, doj: v})} />
                    <InputField label="Work Location" value={editForm.workLocation} onChange={(v: string) => setEditForm({...editForm, workLocation: v})} />
                  </div>
                </Section>

                <Section title="Earnings Components">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Basic Salary" icon={<Wallet className="w-3 h-3"/>} value={editForm.basic} onChange={(v: string) => setEditForm({...editForm, basic: Number(v)})} type="number" />
                    <InputField label="HRA" value={editForm.hra} onChange={(v: string) => setEditForm({...editForm, hra: Number(v)})} type="number" />
                    <InputField label="Special Allowance" value={editForm.specialAllowance} onChange={(v: string) => setEditForm({...editForm, specialAllowance: Number(v)})} type="number" />
                    <InputField label="Bonus" value={editForm.bonus} onChange={(v: string) => setEditForm({...editForm, bonus: Number(v)})} type="number" />
                    <InputField label="Overtime Pay" value={editForm.overtime} onChange={(v: string) => setEditForm({...editForm, overtime: Number(v)})} type="number" />
                  </div>
                </Section>

                <Section title="Deductions & Statutory">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Provident Fund (PF)" value={editForm.pf} onChange={(v: string) => setEditForm({...editForm, pf: Number(v)})} type="number" />
                    <InputField label="ESI" value={editForm.esi} onChange={(v: string) => setEditForm({...editForm, esi: Number(v)})} type="number" />
                    <InputField label="Income Tax (TDS)" value={editForm.incomeTax} onChange={(v: string) => setEditForm({...editForm, incomeTax: Number(v)})} type="number" />
                    <InputField label="Professional Tax" value={editForm.professionalTax} onChange={(v: string) => setEditForm({...editForm, professionalTax: Number(v)})} type="number" />
                    <InputField label="Health Insurance" value={editForm.healthInsurance} onChange={(v: string) => setEditForm({...editForm, healthInsurance: Number(v)})} type="number" />
                    <InputField label="Loan Recovery" value={editForm.loanRecovery} onChange={(v: string) => setEditForm({...editForm, loanRecovery: Number(v)})} type="number" />
                  </div>
                </Section>

                <Section title="Attendance Summary">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Days Present" value={editForm.leavePresent} onChange={(v: string) => setEditForm({...editForm, leavePresent: Number(v)})} type="number" />
                    <InputField label="Days Absent" value={editForm.leaveAbsent} onChange={(v: string) => setEditForm({...editForm, leaveAbsent: Number(v)})} type="number" />
                    <InputField label="LOP Days" value={editForm.lop} onChange={(v: string) => setEditForm({...editForm, lop: Number(v)})} type="number" />
                  </div>
                </Section>

                <Section title="Banking Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Bank Name" value={editForm.bankName} onChange={(v: string) => setEditForm({...editForm, bankName: v})} />
                    <InputField label="Account Number" icon={<CreditCard className="w-3 h-3"/>} value={editForm.bankAccount} onChange={(v: string) => setEditForm({...editForm, bankAccount: v})} />
                    <InputField label="IFSC Code" value={editForm.ifscCode} onChange={(v: string) => setEditForm({...editForm, ifscCode: v})} />
                    <InputField label="PF Number" value={editForm.pfNumber} onChange={(v: string) => setEditForm({...editForm, pfNumber: v})} />
                  </div>
                </Section>
              </div>

              {/* --- RIGHT SIDEBAR: CALCULATION --- */}
              <div className="w-[450px] bg-[#0F172A] p-10 flex flex-col gap-8 text-white relative">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Disbursement Date
                  </label>
                  <input
                    type="date"
                    value={selectedPayDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedPayDate(e.target.value)}
                    className="w-full bg-slate-800 p-4 rounded-2xl text-sm font-bold outline-none border border-slate-700 text-white focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-blue-600 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">Calculated Net Payable</p>
                      <h3 className="text-5xl font-black tracking-tighter">₹{calculateTotals(editForm).net.toLocaleString()}</h3>
                    </div>
                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Earnings</span>
                        <span className="font-bold">₹{calculateTotals(editForm).earnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Deductions</span>
                        <span className="font-bold text-red-300">-₹{calculateTotals(editForm).deductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => generatePayslip(
                        { ...editingStaff, ...editForm, salary: calculateTotals(editForm).earnings } as Staff, 
                        "view", 
                        new Date(selectedPayDate)
                      )}
                      className="py-5 bg-slate-800 hover:bg-slate-700 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 transition-all border border-slate-700"
                    >
                      <Eye className="w-6 h-6 text-blue-400" /> Preview PDF
                    </button>
                    <button 
                      onClick={() => generatePayslip(
                        { ...editingStaff, ...editForm, salary: calculateTotals(editForm).earnings } as Staff, 
                        "download", 
                        new Date(selectedPayDate)
                      )}
                      className="py-5 bg-slate-800 hover:bg-slate-700 rounded-3xl font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 transition-all border border-slate-700"
                    >
                      <Download className="w-6 h-6 text-green-400" /> Export PDF
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-6 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; border: 2px solid #FBFCFE; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* INTERNAL UI COMPONENTS                                                     */
/* -------------------------------------------------------------------------- */

function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{title}</h3>
        <div className="h-[1px] w-full bg-slate-200/50" />
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/50 shadow-sm">{children}</div>
    </div>
  );
}

function InputField({ label, value, type = "text", icon, onChange }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-wider flex items-center gap-2">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className="w-full p-4 bg-[#F8FAFC] border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300"
        placeholder={`Enter ${label}...`}
      />
    </div>
  );
}