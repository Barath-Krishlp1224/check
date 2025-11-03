"use client"


import React, { useState, useCallback } from "react";
import { Search, Edit2, Trash2, Save, X, User, Mail, Phone, Calendar, Briefcase, CreditCard, Building, AlertCircle, CheckCircle } from "lucide-react";

// Define the shape of the employee data
interface IEmployee {
  _id: string;
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: string;
  department: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  photo?: string;
}

// =================================================================
// HELPER COMPONENTS
// =================================================================

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
  // MODIFIED: Replaced blue hover/border with gray/black/white
  <div className="bg-gradient-to-br from-gray-50 to-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-gray-500 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start gap-2 sm:gap-3">
      {/* MODIFIED: Replaced blue text with dark gray */}
      <div className="text-gray-700 group-hover:text-gray-900 transition-colors mt-0.5 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 sm:mb-1">{label}</p>
        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words leading-relaxed">{value || 'N/A'}</p>
      </div>
    </div>
  </div>
);

const InputField = ({ label, name, type = "text", value, onChange, icon }: any) => (
  <div className="space-y-1.5 sm:space-y-2">
    <label className="block text-xs sm:text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 flex-shrink-0">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        // MODIFIED: Replaced blue focus/hover with gray/black
        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 hover:border-gray-500 bg-white"
      />
    </div>
  </div>
);

// =================================================================
// MAIN COMPONENT
// =================================================================

const EmployeeListPage: React.FC = () => {
  const [searchId, setSearchId] = useState("");
  const [employee, setEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<IEmployee>>({});

  const departments = [
    'Accountant', 'Senior Full Stack Developer', 'Junior Full Stack Developer', 
    'Hybrid Mobile Developer', 'Product Manager', 'Project Manager', 
    'QA Engineer – Manual & Automation', 'Social Media Manager & Content Writer', 
    'UI/UX Developer', 'IT Administrator', 'Customer Success Associate'
  ];

  // Search Function
  const handleSearch = useCallback(async (idToSearch: string) => {
    if (!idToSearch) {
      setError("Please enter an Employee ID");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setEmployee(null);
    setIsEditing(false);

    try {
      const res = await fetch(`/api/employees/get/${idToSearch.toUpperCase()}`);
      const data = await res.json();

      if (data.success) {
        setEmployee(data.employee);
        const emp = data.employee;
        setEditFormData({ 
            name: emp.name,
            fatherName: emp.fatherName,
            dateOfBirth: emp.dateOfBirth,
            joiningDate: emp.joiningDate,
            team: emp.team,
            department: emp.department,
            phoneNumber: emp.phoneNumber,
            mailId: emp.mailId,
            accountNumber: emp.accountNumber,
            ifscCode: emp.ifscCode,
        });
        setSuccess("Employee found successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Employee not found");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching employee");
      setTimeout(() => setError(""), 3000);
    }

    setLoading(false);
  }, []);

  // Edit Handlers
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!employee) return;
    setLoading(true);
    setError("");
    setSuccess("");

    if (!editFormData.name || !editFormData.mailId || !editFormData.phoneNumber) {
        setError("Please fill in required fields for update.");
        setLoading(false);
        setTimeout(() => setError(""), 3000);
        return;
    }

    try {
      const res = await fetch(`/api/employees/get/${employee.empId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Employee updated successfully!");
        setEmployee(data.employee);
        setIsEditing(false);
        setEditFormData(data.employee);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update employee.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error updating employee data.");
      setTimeout(() => setError(""), 3000);
    }
    setLoading(false);
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!employee || !window.confirm(`Are you sure you want to delete employee ${employee.empId}? This action cannot be undone.`)) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/employees/get/${employee.empId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setEmployee(null);
        setSearchId("");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to delete employee.");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setError("Error deleting employee.");
      setTimeout(() => setError(""), 3000);
    }
    setLoading(false);
  };

  // Render View Mode
  const RenderEmployeeDetails = () => (
    <div className="border-t border-gray-200 pt-4 sm:pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {employee?.photo ? (
            <img 
              src={employee.photo} 
              alt="Employee Photo" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full shadow-lg ring-4 ring-gray-100 transition-transform hover:scale-105" 
            />
          ) : (
            // MODIFIED: Replaced blue background with gray
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full shadow-lg ring-4 ring-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate">{employee?.name}</h3>
            {/* MODIFIED: Replaced blue text with dark gray */}
            <p className="text-xs sm:text-sm text-gray-600 font-semibold">{employee?.empId}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsEditing(true)}
            // MODIFIED: Replaced blue background with gray/black
            className="flex-1 sm:flex-none group px-3 sm:px-4 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 sm:flex-none group px-3 sm:px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            disabled={loading}
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden xs:inline">Delete</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <InfoCard icon={<User className="w-4 h-4 sm:w-5 sm:h-5" />} label="Father's Name" value={employee?.fatherName} />
        <InfoCard icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} label="Date of Birth" value={employee?.dateOfBirth} />
        <InfoCard icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} label="Joining Date" value={employee?.joiningDate} />
        <InfoCard icon={<Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />} label="Team" value={employee?.team} />
        <InfoCard icon={<Building className="w-4 h-4 sm:w-5 sm:h-5" />} label="Department" value={employee?.department} />
        <InfoCard icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />} label="Phone Number" value={employee?.phoneNumber} />
        <InfoCard icon={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />} label="Email" value={employee?.mailId} />
        <InfoCard icon={<CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />} label="Account Number" value={employee?.accountNumber} />
        <InfoCard icon={<Building className="w-4 h-4 sm:w-5 sm:h-5" />} label="IFSC Code" value={employee?.ifscCode} />
      </div>
    </div>
  );

  // Render Edit Mode
  const RenderEditForm = () => (
    <div className="border-t border-gray-200 pt-4 sm:pt-6 animate-fade-in">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        {/* MODIFIED: Replaced blue background with gray */}
        <div className="w-10 h-10 sm:w-12 sm:h-12  rounded-full flex items-center justify-center flex-shrink-0">
          <Edit2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Edit Employee</h3>
          <p className="text-xs sm:text-sm text-gray-500">ID: {employee?.empId}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <InputField label="Full Name" name="name" value={editFormData.name} onChange={handleEditChange} icon={<User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="Father's Name" name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} icon={<User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="Date of Birth" name="dateOfBirth" type="date" value={editFormData.dateOfBirth} onChange={handleEditChange} icon={<Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="Joining Date" name="joiningDate" type="date" value={editFormData.joiningDate} onChange={handleEditChange} icon={<Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700">Team</label>
          <div className="relative">
            <Briefcase className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <select 
              name="team" 
              value={editFormData.team || ''} 
              onChange={handleEditChange} 
              // MODIFIED: Replaced blue focus/hover with gray/black
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-500"
            >
              <option value="Tech">Tech</option>
              <option value="Accounts">Accounts</option>
              <option value="HR">HR</option>
              <option value="Admin & Operations">Admin & Operations</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700">Department</label>
          <div className="relative">
            <Building className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
            <select 
              name="department" 
              value={editFormData.department || ''} 
              onChange={handleEditChange} 
              // MODIFIED: Replaced blue focus/hover with gray/black
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 bg-white hover:border-gray-500"
            >
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
        </div>

        <InputField label="Phone Number" name="phoneNumber" value={editFormData.phoneNumber} onChange={handleEditChange} icon={<Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="Email" name="mailId" type="email" value={editFormData.mailId} onChange={handleEditChange} icon={<Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="Account Number" name="accountNumber" value={editFormData.accountNumber} onChange={handleEditChange} icon={<CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
        <InputField label="IFSC Code" name="ifscCode" value={editFormData.ifscCode} onChange={handleEditChange} icon={<Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-gray-200">
        <button
          onClick={handleUpdate}
          // MODIFIED: Replaced blue background with gray/black
          className="flex-1 group px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          disabled={loading}
        >
          <Save className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
          disabled={loading}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    // MODIFIED: Changed page background to light gray/white gradient
    <div className="min-h-screen  py-4 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @media (min-width: 475px) {
          .xs\:inline {
            display: inline;
          }
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
        <div className="inline-flex items-center mt-[10%] justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
  <h1 className="text-2xl sm:text-3xl lg:text-3xl xl:text-5xl font-extrabold text-left text-white">
    Employee Management
  </h1>
</div>
        </div>
        
        <div className="bg-white shadow-2xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden">
          {/* MODIFIED: Replaced blue gradient with gray/black gradient */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter Emp ID"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  // MODIFIED: Changed focus ring to white for contrast on dark background
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 lg:py-4 border-2 border-transparent rounded-lg sm:rounded-xl focus:ring-2 focus:ring-white focus:border-white transition-all duration-200 text-sm sm:text-base lg:text-lg shadow-inner"
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch(searchId);
                  }}
                />
              </div>
              <button
                onClick={() => handleSearch(searchId)}
                // MODIFIED: Changed button text color to dark gray/black
                className="group px-6 sm:px-8 py-3 sm:py-3.5 lg:py-4 bg-white text-gray-800 font-bold text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap"
                disabled={loading}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                {loading && !employee ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fade-in">
                <p className="text-red-700 font-medium text-sm sm:text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            {success && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fade-in">
                <p className="text-green-700 font-medium text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{success}</span>
                </p>
              </div>
            )}

            {employee && (
              isEditing ? <RenderEditForm /> : <RenderEmployeeDetails />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeListPage;