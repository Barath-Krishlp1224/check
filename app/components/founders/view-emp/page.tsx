"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  TrendingUp,
  Users,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- Interfaces for Employee Data ---
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

interface Structure {
    [team: string]: {
        [category: string]: string[] | { [subCategory: string]: string[] };
    };
}

interface EmployeeStats {
  totalEmployees: number;
  managerTeamCount: number;
  tlReportingManagerTeamCount: number;
  itAdminTeamCount: number;
  techTeamCount: number;
  accountsTeamCount: number;
  hrTeamCount: number;
  adminOpsTeamCount: number;
  housekeepingTeamCount: number; 
}

interface StatCard {
    label: string;
    value: number;
    icon: string;
    sortKey: string;
    teamKey: string;
}

const structure: Structure = {
  Manager: {
    Manager: ["Manager"],
  },
  "TL-Reporting Manager": {
    "TL-Reporting Manager": ["Team Lead", "Reporting Manager"],
  },
  HR: {
    HR: ["HR Executive", "HR Manager"],
  },
  Tech: {
    Developer: {
      Frontend: ["Junior Frontend Developer", "Senior Frontend Developer"],
      Backend: ["Junior Backend Developer", "Senior Backend Developer"],
      "Full Stack": [
        "Junior Full Stack Developer",
        "Senior Full Stack Developer",
      ],
      "UI/UX Developer": ["UI/UX Developer"],
    },
    DevOps: ["Product Manager"],
    Tester: ["QA Engineer – Manual & Automation"],
    Designer: ["UI/UX Designer"],
    "Team Leads": ["Project Manager"],
  },
  "IT Admin": {
    "IT Admin": ["IT Administrator"],
  },
  Accounts: {
    Accountant: ["Accountant", "Senior Accountant"],
  },
  "Admin & Operations": {
    "Admin & Operations": ["Admin & Operations"],
  },
  Housekeeping: {
    Housekeeping: ["Housekeeper", "Senior Housekeeper"],
  },
  "TL Accountant": {
    "TL Accountant": ["TL Accountant"],
  },
};

const teams = Object.keys(structure);

const teamOptions = [
  "Manager",
  "TL-Reporting Manager",
  "HR",
  "Tech",
  "IT Admin",
  "Accounts",
  "Admin & Operations",
  "Housekeeping",
  "TL Accountant",
];

const departments = Object.values(structure)
    .flatMap(categories => 
        Object.values(categories).flatMap(roles => 
            Array.isArray(roles) ? roles : Object.values(roles).flat()
        )
    )
    .filter((v, i, a) => a.indexOf(v) === i);

// --- Reusable Components ---

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
  accept,
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
            value={type === "file" ? undefined : (value ?? "")}
            onChange={onChange}
            ref={inputRef}
            accept={accept}
            onFocus={() => onFocus && onFocus(name)}
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 bg-white file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
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

const EmployeeStatsDisplay = ({ setSelectedTeam }: { setSelectedTeam: (team: string) => void }) => {
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    managerTeamCount: 0,
    tlReportingManagerTeamCount: 0,
    itAdminTeamCount: 0,
    techTeamCount: 0,
    accountsTeamCount: 0,
    hrTeamCount: 0,
    adminOpsTeamCount: 0,
    housekeepingTeamCount: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/employees/stats");
        const data = await res.json();

        if (!data || data.error) {
          console.error("Error fetching stats:", data?.error ?? data);
          return;
        }

        setStats({
          totalEmployees: data.totalEmployees ?? 0,
          managerTeamCount: data.managerTeamCount ?? 0,
          tlReportingManagerTeamCount:
            data.tlReportingManagerTeamCount ?? 0,
          itAdminTeamCount: data.itAdminTeamCount ?? 0,
          techTeamCount: data.techTeamCount ?? 0,
          accountsTeamCount: data.accountsTeamCount ?? 0,
          hrTeamCount: data.hrTeamCount ?? 0,
          adminOpsTeamCount: data.adminOpsTeamCount ?? 0,
          housekeepingTeamCount: data.housekeepingTeamCount ?? 0,
        });
      } catch (err) {
        console.error("Error fetching employee stats:", err);
      }
    };

    fetchStats();
  }, []);

  const MOCK_FOUNDERS_COUNT = 3;
  const totalStaffExclFounders = stats.totalEmployees > MOCK_FOUNDERS_COUNT 
    ? stats.totalEmployees - MOCK_FOUNDERS_COUNT 
    : 0;

  const tlAccountantCount = stats.accountsTeamCount;

  const allCards: StatCard[] = [
    { 
      label: "Total Staff (Excl. Founders)", 
      value: totalStaffExclFounders, 
      icon: "/1.png", 
      sortKey: "A",
      teamKey: "None", 
    },
    { label: "Manager Team", value: stats.managerTeamCount, icon: "/3.png", sortKey: "Manager Team", teamKey: "Manager" },
    { label: "TL - Reporting Manager", value: stats.tlReportingManagerTeamCount, icon: "/4.png", sortKey: "TL - Reporting Manager", teamKey: "TL-Reporting Manager" },
    { label: "IT Admin Team", value: stats.itAdminTeamCount, icon: "/5.png", sortKey: "IT Admin Team", teamKey: "IT Admin" },
    { label: "Tech Team", value: stats.techTeamCount, icon: "/6.png", sortKey: "Tech Team", teamKey: "Tech" },
    { label: "Accounts Team", value: stats.accountsTeamCount, icon: "/7.png", sortKey: "Accounts Team", teamKey: "Accounts" },
    { label: "TL - Accountant", value: tlAccountantCount, icon: "/7.png", sortKey: "TL - Accountant", teamKey: "TL Accountant" }, 
    { label: "HR Team", value: stats.hrTeamCount, icon: "/8.png", sortKey: "HR Team", teamKey: "HR" },
    { label: "Admin & Ops Team", value: stats.adminOpsTeamCount, icon: "/9.png", sortKey: "Admin & Ops Team", teamKey: "Admin & Operations" },
    { label: "Housekeeping Team", value: stats.housekeepingTeamCount, icon: "/10.png", sortKey: "Housekeeping Team", teamKey: "Housekeeping" },
  ];

  const primaryCard = allCards[0];
  const secondaryCards = allCards.slice(1);
  secondaryCards.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const statsCards: StatCard[] = [primaryCard, ...secondaryCards];

  return (
    <div className={`mt-8 mb-12 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-10 flex items-center justify-center gap-2">
        <TrendingUp className="w-8 h-8 text-gray-800" /> 
        Organization Staff Count & Directory Access
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {statsCards.map((card, index) => {
          const isClickable = card.teamKey !== "None";
          const teamName = isClickable ? card.teamKey : card.label;

          const handleClick = () => {
            if (isClickable) {
              setSelectedTeam(card.teamKey);
            }
          };

          return (
            <motion.div
              key={card.label}
              onClick={handleClick}
              className={`p-4 rounded-xl border border-gray-200 shadow-lg transition-all duration-300 ${
                isClickable
                  ? "bg-white hover:bg-gray-100 cursor-pointer" 
                  : "bg-gray-100 cursor-default"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={isClickable ? { scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium mb-1 uppercase tracking-wider truncate ${isClickable ? "text-gray-800" : "text-gray-500"}`}>
                    {card.label}
                  </p>
                  <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isClickable ? "bg-gray-800/10" : "bg-gray-300/50"}`}>
                  {isClickable ? <Users className="w-6 h-6 text-gray-800" /> : <TrendingUp className="w-6 h-6 text-gray-600" />}
                </div>
              </div>
              {isClickable && (
                <p className="mt-2 text-xs font-semibold text-gray-600">
                  Click to view staff list
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
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

  const getSubcategoriesForTeam = useMemo(() => {
    if (!selectedTeam || !structure[selectedTeam]) return {};
    return structure[selectedTeam];
  }, [selectedTeam]);

  const filteredEmployees = employees.filter((emp) => {
    if (!selectedTeam) return false;

    const selectedTeamRoles = structure[selectedTeam];
    if (!selectedTeamRoles) return false;

    let rolesToMatch: string[] = [];
    
    if (selectedCategory) {
        const categoryRoles = selectedTeamRoles[selectedCategory];
        if (Array.isArray(categoryRoles)) {
            rolesToMatch = categoryRoles;
        } else if (typeof categoryRoles === 'object' && categoryRoles !== null) {
            if (selectedSubCategory) {
                rolesToMatch = categoryRoles[selectedSubCategory] || [];
            } else {
                rolesToMatch = Object.values(categoryRoles).flat() as string[];
            }
        }
    } else {
        rolesToMatch = Object.values(selectedTeamRoles).flatMap(roles => {
            if (Array.isArray(roles)) {
                return roles;
            } else if (typeof roles === 'object' && roles !== null) {
                return Object.values(roles).flat();
            }
            return [];
        }) as string[];
    }

    if (rolesToMatch.length === 0) return false;
    
    return rolesToMatch.includes(emp.department);
  });

  const handleOpenDetail = (emp: IEmployee) => {
    setSelectedEmployee(emp);
    setIsEditing(false);
    clearMessages();

    setEditFormData({ ...emp });
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

  // --- Helper to convert file to base64 ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleEditChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "file") {
      const fileInput = e.target as HTMLInputElement;
      if (fileInput.files && fileInput.files[0]) {
        // Check if a document already exists for this field
        const existingDoc = (editFormData as any)[name];
        if (existingDoc) {
          const confirmReplace = window.confirm(
            `A document is already uploaded for "${name}". Do you want to replace it with the new file?`
          );
          if (!confirmReplace) {
            // Reset the input field value
            fileInput.value = "";
            return;
          }
        }

        try {
          const base64 = await fileToBase64(fileInput.files[0]);
          setEditFormData((prev) => ({ ...prev, [name]: base64 }));
        } catch (err) {
          console.error("File conversion error:", err);
        }
      }
    } else {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;

    // Conformation box before saving
    const confirmSave = window.confirm("Are you sure you want to save these changes?");
    if (!confirmSave) return;

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
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full shadow-lg ring-4 ring-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1 truncate">{selectedEmployee?.name}</h3>
            <p className="text-sm text-gray-600 font-semibold">{selectedEmployee?.empId}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button type="button" onClick={() => setIsEditing(true)} className="flex-1 mt-10 sm:flex-none group px-4 py-2 bg-gray-800 text-white font-semibold text-sm rounded-lg hover:bg-gray-900 transition-all duration-300 shadow-md flex items-center justify-center gap-2">
            <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Edit
          </button>
          <button type="button" onClick={handleDelete} className="flex-1 sm:flex-none mt-10 group px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md flex items-center justify-center gap-2" disabled={loading}>
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
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-800">
            <Edit2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-gray-900 truncate">Edit Employee: {selectedEmployee?.name}</h3>
            <p className="text-sm text-gray-500">ID: {selectedEmployee?.empId}</p>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Basic & Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Full Name" name="name" value={editFormData.name} onChange={handleEditChange} icon={<User className="w-4 h-4" />} inputRef={makeRefSetter("name")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Father's Name" name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} icon={<User className="w-4 h-4" />} inputRef={makeRefSetter("fatherName")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Date of Birth" name="dateOfBirth" type="date" value={editFormData.dateOfBirth} onChange={handleEditChange} icon={<Calendar className="w-4 h-4" />} inputRef={makeRefSetter("dateOfBirth")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Joining Date" name="joiningDate" type="date" value={editFormData.joiningDate} onChange={handleEditChange} icon={<Calendar className="w-4 h-4" />} inputRef={makeRefSetter("joiningDate")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Phone Number" name="phoneNumber" value={editFormData.phoneNumber} onChange={handleEditChange} icon={<Phone className="w-4 h-4" />} inputRef={makeRefSetter("phoneNumber")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Email" name="mailId" type="email" value={editFormData.mailId} onChange={handleEditChange} icon={<Mail className="w-4 h-4" />} inputRef={makeRefSetter("mailId")} onFocus={(n: string) => setFocusedField(n)} />
          
          <InputField label="Team" name="team" type="select" value={editFormData.team} onChange={handleEditChange} icon={<Briefcase className="w-4 h-4" />} inputRef={makeRefSetter("team")} onFocus={(n: string) => setFocusedField(n)}>
            {teamOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </InputField>

          <InputField label="Department" name="department" type="select" value={editFormData.department} onChange={handleEditChange} icon={<Building className="w-4 h-4" />} inputRef={makeRefSetter("department")} onFocus={(n: string) => setFocusedField(n)}>
            {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </InputField>
        </div>

        <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b pb-1">Financial & Compliance</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="Account Number" name="accountNumber" value={editFormData.accountNumber} onChange={handleEditChange} icon={<CreditCard className="w-4 h-4" />} inputRef={makeRefSetter("accountNumber")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="IFSC Code" name="ifscCode" value={editFormData.ifscCode} onChange={handleEditChange} icon={<Building className="w-4 h-4" />} inputRef={makeRefSetter("ifscCode")} onFocus={(n: string) => setFocusedField(n)} />
          <InputField label="Employment Type" name="employmentType" type="select" value={editFormData.employmentType} onChange={handleEditChange} icon={<Briefcase className="w-4 h-4" />} inputRef={makeRefSetter("employmentType")} onFocus={(n: string) => setFocusedField(n)}>
            <option value="Fresher">Fresher</option>
            <option value="Experienced">Experienced</option>
          </InputField>
        </div>

        <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-3 border-b pb-1">Document Uploads (Re-upload/New)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InputField label="Aadhar Document" name="aadharDoc" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
          <InputField label="PAN Document" name="panDoc" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
          <InputField label="10th Marksheet" name="tenthMarksheet" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
          <InputField label="12th Marksheet" name="twelfthMarksheet" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
          <InputField label="Provisional Cert." name="provisionalCertificate" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
          <InputField label="Experience Cert." name="experienceCertificate" type="file" accept=".pdf,image/*" onChange={handleEditChange} icon={<Upload className="w-4 h-4" />} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-gray-200">
          <button type="button" onClick={handleUpdate} className="flex-1 group px-6 py-3 bg-gray-800 text-white font-semibold text-sm rounded-lg hover:bg-gray-900 transition-all duration-300 shadow-md flex items-center justify-center gap-2" disabled={loading}>
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

  const RenderTechCategories = () => {
    const techCategories = getSubcategoriesForTeam;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(techCategories).map(([category, rolesOrSubCategories]) => {
                const hasSubcategories = !Array.isArray(rolesOrSubCategories);
                const handleCategoryClick = () => {
                    setSelectedCategory(category);
                    setSelectedSubCategory(null);
                };
                if (hasSubcategories) {
                    return (
                        <motion.div key={category} whileHover={{ scale: 1.05 }} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl shadow-lg">
                            <h3 className="text-xl font-semibold text-gray-900 text-center mb-4 cursor-pointer hover:text-gray-800" onClick={handleCategoryClick}>{category}</h3>
                            <div className="flex flex-col gap-3">
                                {Object.keys(rolesOrSubCategories).map((subCategory) => (
                                    <motion.div key={subCategory} whileHover={{ scale: 1.03 }} onClick={() => { setSelectedCategory(category); setSelectedSubCategory(subCategory); }} className="bg-white border border-gray-200 text-gray-800 rounded-xl text-center py-3 cursor-pointer hover:bg-gray-100 transition-all duration-300">{subCategory}</motion.div>
                                ))}
                            </div>
                        </motion.div>
                    );
                } else {
                    return (
                        <motion.div key={category} whileHover={{ scale: 1.05 }} onClick={handleCategoryClick} className="bg-gray-50 border border-gray-200 p-6 rounded-2xl cursor-pointer text-center hover:bg-gray-100 transition-all duration-300 shadow-lg">
                            <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                        </motion.div>
                    );
                }
            })}
        </div>
    );
  };
  
  const getBreadcrumbTitle = () => {
      if (selectedSubCategory) return `${selectedSubCategory} (${filteredEmployees.length})`;
      if (selectedCategory) return `${selectedCategory} (${filteredEmployees.length})`;
      return `${selectedTeam} Team (${filteredEmployees.length})`;
  }

  const handleBackNavigation = () => {
      if (selectedSubCategory) {
          setSelectedSubCategory(null);
      } else if (selectedCategory) {
          setSelectedCategory(null);
      } else {
          setSelectedTeam(null);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 py-10 px-5">
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
      
      <div className="max-w-6xl mx-auto w-full no-print">
        {!selectedTeam && <EmployeeStatsDisplay setSelectedTeam={setSelectedTeam} />}

        {selectedTeam && !selectedEmployee && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {selectedCategory || selectedTeam === "Tech" ? getBreadcrumbTitle() : `${selectedTeam} Teams`}
              </h2>
              <button type="button" onClick={handleBackNavigation} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                ← Back to {selectedCategory || selectedSubCategory ? selectedTeam : 'Directory'}
              </button>
            </div>

            {selectedTeam && !selectedCategory && (structure[selectedTeam] && Object.keys(structure[selectedTeam]).length > 1 || selectedTeam === "Tech") && (
                <RenderTechCategories />
            )}

            {filteredEmployees.length > 0 && selectedTeam && (selectedCategory || (Object.keys(structure[selectedTeam] || {}).length === 1 && !selectedCategory)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
                {filteredEmployees.map((emp) => (
                  <motion.div key={emp._id} whileHover={{ scale: 1.03 }} onClick={() => handleOpenDetail(emp)} className="bg-white border border-gray-200 p-5 rounded-xl cursor-pointer hover:bg-gray-100 transition-all duration-300 shadow-md">
                    <div className="flex flex-col items-center text-center">
                      <img src={emp.photo || "/default-avatar.png"} alt={emp.name} className="w-20 h-20 object-cover rounded-full mb-3 border-2 border-gray-300" />
                      <p className="text-lg font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-sm text-gray-600">{emp.empId}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : selectedCategory && filteredEmployees.length === 0 ? (
                <p className="text-center text-gray-500">No employees found in this selection.</p>
            ) : null}
          </div>
        )}

        <AnimatePresence>
          {selectedEmployee && (
            <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} tabIndex={-1}>
              <motion.div className="bg-white text-gray-900 rounded-2xl max-w-4xl w-full p-6 sm:p-8 relative max-h-[80vh] mt-20 overflow-y-auto" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
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