"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2,
  Trash2,
  Save,
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  CreditCard,
  Building,
  AlertCircle,
  CheckCircle,
  IdCard,
  FileText,
  XCircle,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface IEmployee {
  _id: string;
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: string;
  category?: string;
  subCategory?: string;
  department: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  photo?: string;
  employmentType: "Fresher" | "Experienced";
  aadharNumber: string;
  panNumber: string;
  aadharDoc?: string;
  panDoc?: string;
  tenthMarksheet?: string;
  twelfthMarksheet?: string;
  provisionalCertificate?: string;
  experienceCertificate?: string;
}

interface DocPreviewState {
  label: string;
  url: string;
}

const teams = ["Tech", "Accounts", "HR", "Admin & Operations"];

const techCategories = [
  {
    name: "Developer",
    children: ["Frontend", "Backend", "Full Stack"],
  },
  { name: "IT Admin" },
  { name: "DevOps" },
  { name: "Tester" },
  { name: "Designer" },
  { name: "Team Leads" },
];

const departments = [
  "Accountant",
  "Senior Full Stack Developer",
  "Junior Full Stack Developer",
  "Hybrid Mobile Developer",
  "Product Manager",
  "Project Manager",
  "QA Engineer – Manual & Automation",
  "Social Media Manager & Content Writer",
  "UI/UX Developer",
  "IT Administrator",
  "Customer Success Associate",
];

const teamOptions = [
  "Founders",
  "Manager",
  "TL-Reporting Manager",
  "IT Admin",
  "Tech",
  "Accounts",
  "HR",
  "Admin & Operations",
];

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="bg-gray-100 rounded-xl p-4">
    <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
    <p className="text-gray-900 font-medium">{value || "—"}</p>
  </div>
);

const DocumentCard = ({
  label,
  url,
  onView,
}: {
  label: string;
  url?: string;
  onView: (label: string, url: string) => void;
}) => {
  const hasDoc = !!url;
  return (
    <button
      type="button"
      disabled={!hasDoc}
      onClick={() => hasDoc && url && onView(label, url)}
      className={`w-full text-left bg-gray-100 p-3 rounded-xl border transition-all duration-300 ${
        hasDoc
          ? "border-gray-200 hover:border-gray-400 cursor-pointer"
          : "border-dashed border-gray-300 cursor-not-allowed opacity-70"
      }`}
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-gray-600" />
        {label}
      </p>
      {hasDoc ? (
        <p className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 underline">
          View Document
        </p>
      ) : (
        <p className="text-sm text-gray-400">Not uploaded</p>
      )}
    </button>
  );
};

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  icon,
  children,
  inputRef,
  onFocus,
}: any) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs sm:text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0">{icon}</div>
        {type === "select" ? (
          <select
            name={name}
            value={value ?? ""}
            onChange={onChange}
            ref={inputRef}
            onFocus={() => onFocus && onFocus(name)}
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 bg-white"
          >
            {children}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value ?? ""}
            onChange={onChange}
            ref={inputRef}
            onFocus={() => onFocus && onFocus(name)}
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 bg-white"
          />
        )}
      </div>
    </div>
  );
};

const DocumentPreviewModal = ({ doc, onClose }: { doc: DocPreviewState | null; onClose: () => void }) => {
  if (!doc) return null;
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(doc.url);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <motion.div
        className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{doc.label}</h3>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-red-600 font-medium">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Close
          </button>
        </div>

        <div className="flex-1 bg-gray-100 overflow-y-auto">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={doc.url} alt={doc.label} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
            </div>
          ) : (
            <iframe src={doc.url} className="w-full h-full min-h-[60vh] border-0" title={doc.label} />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function ViewEmpPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<IEmployee>>({});
  const [docPreview, setDocPreview] = useState<DocPreviewState | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const handleGoHome = () => {
    router.push("/components/it-admin");
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees/get/all");
      const data = await res.json();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees as IEmployee[]);
      } else {
        console.warn("Invalid employee data:", data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (focusedField) {
      const node = inputRefs.current[focusedField];
      if (node) {
        try {
          node.focus();
          if ("selectionStart" in node && typeof node.selectionStart === "number") {
            const len = (node as HTMLInputElement).value.length;
            (node as HTMLInputElement).setSelectionRange(len, len);
          }
        } catch (e) {
        }
      }
    }
  }, [editFormData, isEditing, focusedField]);

  const filteredEmployees = employees.filter((emp) => {
    if (!selectedTeam) return false;

    const team = emp.team?.trim().toLowerCase();
    const category = emp.category?.trim().toLowerCase() || "";
    const subCategory = emp.subCategory?.trim().toLowerCase() || "";
    const selected = selectedTeam.trim().toLowerCase();

    if (selected !== "tech") {
      return team === selected.toLowerCase();
    }

    if (selected === "tech") {
      if (!selectedCategory) return false;

      const selCat = selectedCategory.toLowerCase();

      if (category === selCat) {
        if (selCat === "developer") {
          if (!selectedSubCategory) return false;
          return subCategory === selectedSubCategory.toLowerCase();
        } else {
          return !selectedSubCategory && (subCategory === "" || subCategory === "n/a");
        }
      }
    }

    return false;
  });

  const handleOpenDetail = (emp: IEmployee) => {
    setSelectedEmployee(emp);
    setIsEditing(false);
    clearMessages();

    setEditFormData({
      name: emp.name,
      fatherName: emp.fatherName,
      dateOfBirth: emp.dateOfBirth,
      joiningDate: emp.joiningDate,
      team: emp.team,
      category: emp.category,
      subCategory: emp.subCategory,
      department: emp.department,
      phoneNumber: emp.phoneNumber,
      mailId: emp.mailId,
      accountNumber: emp.accountNumber,
      ifscCode: emp.ifscCode,
      employmentType: emp.employmentType,
      aadharNumber: emp.aadharNumber,
      panNumber: emp.panNumber,
    });

    setFocusedField(null);
    inputRefs.current = inputRefs.current || {};
  };

  const handleCloseDetail = () => {
    setSelectedEmployee(null);
    setIsEditing(false);
    clearMessages();
    setFocusedField(null);
  };

  const handlePrint = () => window.print();

  const openDoc = (label: string, url: string) => {
    setDocPreview({ label, url });
  };

  const closeDoc = () => setDocPreview(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;
    setLoading(true);
    clearMessages();

    if (!editFormData.name || !editFormData.mailId || !editFormData.phoneNumber) {
      setError("Please fill in required fields for update.");
      setLoading(false);
      setTimeout(clearMessages, 3000);
      return;
    }

    try {
      const res = await fetch(`/api/employees/get/${selectedEmployee.empId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Employee updated successfully!");
        setSelectedEmployee(data.employee as IEmployee);
        setIsEditing(false);
        setEditFormData(data.employee);
        fetchEmployees();
        setTimeout(clearMessages, 3000);
      } else {
        setError(data.message || "Failed to update employee.");
        setTimeout(clearMessages, 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error updating employee data.");
      setTimeout(clearMessages, 3000);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (
      !selectedEmployee ||
      !window.confirm(`Are you sure you want to delete employee ${selectedEmployee.empId}? This action cannot be undone.`)
    )
      return;

    setLoading(true);
    clearMessages();

    try {
      const res = await fetch(`/api/employees/get/${selectedEmployee.empId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setSelectedEmployee(null);
        fetchEmployees();
        setTimeout(clearMessages, 3000);
      } else {
        setError(data.message || "Failed to delete employee.");
        setTimeout(clearMessages, 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error deleting employee.");
      setTimeout(clearMessages, 3000);
    }
    setLoading(false);
  };

  const RenderEmployeeDetails = () => (
    <div className="pt-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {selectedEmployee?.photo ? (
            <img src={selectedEmployee.photo} alt="Employee Photo" className="w-24 h-24 object-cover rounded-full shadow-lg ring-4 ring-gray-100 transition-transform" />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full shadow-lg ring-4 ring-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">{selectedEmployee?.name}</h3>
            <p className="text-sm text-gray-600 font-semibold">{selectedEmployee?.empId}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button type="button" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none group px-4 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md flex items-center justify-center gap-2">
            <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Edit
          </button>
          <button type="button" onClick={handleDelete} className="flex-1 sm:flex-none group px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md flex items-center justify-center gap-2" disabled={loading}>
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Delete
          </button>
        </div>
      </div>

      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Profile Details</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <InfoCard icon={<User className="w-5 h-5" />} label="Father's Name" value={selectedEmployee?.fatherName} />
        <InfoCard icon={<Calendar className="w-5 h-5" />} label="Date of Birth" value={selectedEmployee?.dateOfBirth} />
        <InfoCard icon={<Calendar className="w-5 h-5" />} label="Joining Date" value={selectedEmployee?.joiningDate} />
        <InfoCard icon={<Briefcase className="w-5 h-5" />} label="Team" value={selectedEmployee?.team} />
        <InfoCard icon={<Building className="w-5 h-5" />} label="Department" value={selectedEmployee?.department} />
        <InfoCard icon={<Phone className="w-5 h-5" />} label="Phone Number" value={selectedEmployee?.phoneNumber} />
        <InfoCard icon={<Mail className="w-5 h-5" />} label="Email" value={selectedEmployee?.mailId} />
        <InfoCard icon={<CreditCard className="w-5 h-5" />} label="Account Number" value={selectedEmployee?.accountNumber} />
        <InfoCard icon={<Building className="w-5 h-5" />} label="IFSC Code" value={selectedEmployee?.ifscCode} />
        <InfoCard icon={<Briefcase className="w-5 h-5" />} label="Employment Type" value={selectedEmployee?.employmentType} />
        <InfoCard icon={<IdCard className="w-5 h-5" />} label="Aadhar Number" value={selectedEmployee?.aadharNumber} />
        <InfoCard icon={<IdCard className="w-5 h-5" />} label="PAN Number" value={selectedEmployee?.panNumber} />
      </div>

      <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Documents</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <DocumentCard label="Aadhar Document" url={selectedEmployee?.aadharDoc} onView={openDoc} />
        <DocumentCard label="PAN Document" url={selectedEmployee?.panDoc} onView={openDoc} />
        <DocumentCard label="10th Marksheet" url={selectedEmployee?.tenthMarksheet} onView={openDoc} />
        <DocumentCard label="12th Marksheet" url={selectedEmployee?.twelfthMarksheet} onView={openDoc} />
        <DocumentCard label="Provisional Cert." url={selectedEmployee?.provisionalCertificate} onView={openDoc} />
        <DocumentCard label="Experience Cert." url={selectedEmployee?.experienceCertificate} onView={openDoc} />
      </div>

      <div className="mt-8 text-center">
        <button type="button" onClick={handlePrint} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
          🖨️ Print / Download PDF
        </button>
      </div>
    </div>
  );

  const RenderEditForm = () => {
    const makeRefSetter = (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      inputRefs.current[name] = el;
    };

    return (
      <div className="pt-2 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-700">
            <Edit2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-900 truncate">Edit Employee: {selectedEmployee?.name}</h3>
            <p className="text-sm text-gray-500">ID: {selectedEmployee?.empId}</p>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Basic & Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            label="Full Name"
            name="name"
            value={editFormData.name}
            onChange={handleEditChange}
            icon={<User className="w-4 h-4" />}
            inputRef={makeRefSetter("name")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField
            label="Father's Name"
            name="fatherName"
            value={editFormData.fatherName}
            onChange={handleEditChange}
            icon={<User className="w-4 h-4" />}
            inputRef={makeRefSetter("fatherName")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={editFormData.dateOfBirth}
            onChange={handleEditChange}
            icon={<Calendar className="w-4 h-4" />}
            inputRef={makeRefSetter("dateOfBirth")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField
            label="Joining Date"
            name="joiningDate"
            type="date"
            value={editFormData.joiningDate}
            onChange={handleEditChange}
            icon={<Calendar className="w-4 h-4" />}
            inputRef={makeRefSetter("joiningDate")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField
            label="Phone Number"
            name="phoneNumber"
            value={editFormData.phoneNumber}
            onChange={handleEditChange}
            icon={<Phone className="w-4 h-4" />}
            inputRef={makeRefSetter("phoneNumber")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField
            label="Email"
            name="mailId"
            type="email"
            value={editFormData.mailId}
            onChange={handleEditChange}
            icon={<Mail className="w-4 h-4" />}
            inputRef={makeRefSetter("mailId")}
            onFocus={(n: string) => setFocusedField(n)}
          />

          <InputField
            label="Team"
            name="team"
            type="select"
            value={editFormData.team}
            onChange={handleEditChange}
            icon={<Briefcase className="w-4 h-4" />}
            inputRef={makeRefSetter("team")}
            onFocus={(n: string) => setFocusedField(n)}
          >
            {teamOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </InputField>

          <InputField
            label="Department"
            name="department"
            type="select"
            value={editFormData.department}
            onChange={handleEditChange}
            icon={<Building className="w-4 h-4" />}
            inputRef={makeRefSetter("department")}
            onFocus={(n: string) => setFocusedField(n)}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </InputField>
        </div>

        <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b pb-1">Financial & Compliance</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Account Number" name="accountNumber" value={editFormData.accountNumber} onChange={handleEditChange} icon={<CreditCard className="w-4 h-4" />} inputRef={makeRefSetter("accountNumber")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="IFSC Code" name="ifscCode" value={editFormData.ifscCode} onChange={handleEditChange} icon={<Building className="w-4 h-4" />} inputRef={makeRefSetter("ifscCode")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Aadhar Number" name="aadharNumber" value={editFormData.aadharNumber} onChange={handleEditChange} icon={<IdCard className="w-4 h-4" />} inputRef={makeRefSetter("aadharNumber")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField
            label="PAN Number"
            name="panNumber"
            value={editFormData.panNumber}
            onChange={(e: any) =>
              handleEditChange({
                ...e,
                target: { ...e.target, value: (e.target.value || "").toUpperCase() },
              } as any)
            }
            icon={<IdCard className="w-4 h-4" />}
            inputRef={makeRefSetter("panNumber")}
            onFocus={(n: string) => setFocusedField(n)}
          />
          <InputField label="Employment Type" name="employmentType" type="select" value={editFormData.employmentType} onChange={handleEditChange} icon={<Briefcase className="w-4 h-4" />} inputRef={makeRefSetter("employmentType")} onFocus={(n: string) => setFocusedField(n)}>
            <option value="Fresher">Fresher</option>
            <option value="Experienced">Experienced</option>
          </InputField>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-gray-200">
          <button type="button" onClick={handleUpdate} className="flex-1 group px-6 py-3 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md flex items-center justify-center gap-2" disabled={loading}>
            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2" disabled={loading}>
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen **flex items-center justify-center** bg-gradient-to-br from-slate-800 to-slate-950 text-white py-10 px-5">
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .print-only { display: none; }
        @media print {
            .no-print { display: none; }
            .print-only { display: block; }
            body { background: white !important; }
        }
      `}</style>
      
      {/* Home Button (Fixed position) */}
      <div className="fixed top-5 mt-40 right-5 z-50 no-print">
        <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 text-base font-semibold border-2 border-gray-300 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        >
            <List size={20} />
            Home
        </button>
      </div>

      <div className="max-w-6xl mt-[20%] mx-auto **w-full** no-print">
        <h1 className="text-4xl font-bold text-center mb-10">Employee Directory</h1>

        {!selectedTeam && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {teams.map((team) => (
              <motion.div key={team} whileHover={{ scale: 1.05 }} onClick={() => setSelectedTeam(team)} className="bg-white/10 border border-white/20 p-6 rounded-2xl cursor-pointer text-center hover:bg-white/20 transition-all duration-300 shadow-xl">
                <h2 className="text-xl font-semibold">{team}</h2>
              </motion.div>
            ))}
          </div>
        )}

        {selectedTeam === "Tech" && !selectedCategory && !selectedEmployee && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Tech Teams</h2>
              <button type="button" onClick={() => setSelectedTeam(null)} className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition">← Back</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {techCategories.map((cat) => (
                <motion.div key={cat.name} whileHover={{ scale: 1.05 }} className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-xl">
                  <h3 onClick={() => !cat.children && setSelectedCategory(cat.name)} className={`text-xl font-semibold text-center ${cat.children ? "mb-4" : "cursor-pointer hover:text-blue-400"}`}>{cat.name}</h3>

                  {cat.children && (
                    <div className="flex flex-col gap-3">
                      {cat.children.map((child) => (
                        <motion.div key={child} whileHover={{ scale: 1.03 }} onClick={() => { setSelectedCategory(cat.name); setSelectedSubCategory(child); }} className="bg-white/5 border border-white/10 rounded-xl text-center py-3 cursor-pointer hover:bg-white/20 transition-all duration-300">
                          {child}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedTeam && (selectedTeam !== "Tech" || selectedCategory) && !selectedEmployee && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {selectedTeam === "Tech" ? `${selectedSubCategory || selectedCategory} (${filteredEmployees.length})` : `${selectedTeam} Team (${filteredEmployees.length})`}
              </h2>
              <button type="button" onClick={() => { if (selectedTeam !== "Tech") { setSelectedTeam(null); } else if (selectedSubCategory) { setSelectedSubCategory(null); } else if (selectedCategory) { setSelectedCategory(null); } else { setSelectedTeam(null); } }} className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition">← Back</button>
            </div>

            {loading ? (
              <p className="text-center text-gray-400">Loading employees...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-center text-gray-400">No employees found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredEmployees.map((emp) => (
                  <motion.div key={emp._id} whileHover={{ scale: 1.03 }} onClick={() => handleOpenDetail(emp)} className="bg-white/10 border border-white/20 p-5 rounded-xl cursor-pointer hover:bg-white/20 transition-all duration-300 shadow-lg">
                    <div className="flex flex-col items-center text-center">
                      <img src={emp.photo || "/default-avatar.png"} alt={emp.name} className="w-20 h-20 object-cover rounded-full mb-3 border-2 border-white/30" />
                      <p className="text-lg font-semibold">{emp.name}</p>
                      <p className="text-sm text-gray-300">{emp.empId}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        <AnimatePresence>
          {selectedEmployee && (
            <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} tabIndex={-1}>
              <motion.div className="bg-white text-gray-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                <button type="button" onClick={handleCloseDetail} className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-lg p-2 rounded-full hover:bg-gray-100 transition" disabled={loading}>
                  <X className="w-6 h-6" />
                </button>

                {error && <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in"><p className="text-red-700 font-medium text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></p></div>}
                {success && <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fade-in"><p className="text-green-700 font-medium text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" /><span>{success}</span></p></div>}

                {isEditing ? <RenderEditForm /> : <RenderEmployeeDetails />}

                {loading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
                    <svg className="animate-spin h-8 w-8 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>{docPreview && <DocumentPreviewModal doc={docPreview} onClose={closeDoc} />}</AnimatePresence>
    </div>
  );
}