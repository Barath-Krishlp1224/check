"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IEmployee {
  _id: string;
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: string;
  category?: string;      // ✅ add category
  subCategory?: string;   // ✅ add subCategory
  department: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  photo?: string;
}

const teams = ["Tech", "Accounts", "HR", "Admin & Operations"];

const techCategories = [
  {
    name: "Developer",
    children: ["Frontend", "Backend", "Full Stack"], // Corrected to match form structure
  },
  { name: "IT Admin" }, // Corrected to match form structure
  { name: "DevOps" },
  { name: "Tester" },
  { name: "Designer" },
  { name: "Team Leads" }, // Corrected to match form structure
];

export default function ViewEmpPage() {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/employees/get/all");
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        } else {
          console.warn("Invalid employee data:", data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

// ⚠️ CORRECTED FILTERING LOGIC
const filteredEmployees = employees.filter((emp) => {
  if (!selectedTeam) return false;

  const team = emp.team?.trim().toLowerCase();
  const category = emp.category?.trim().toLowerCase() || "";
  // SubCategory is "" in the DB for non-Developers
  const subCategory = emp.subCategory?.trim().toLowerCase() || ""; 
  const selected = selectedTeam.trim().toLowerCase();

  // 1. NON-TECH TEAMS: Simple team match
  if (selected !== "tech") {
    return team === selected;
  }

  // 2. TECH TEAM LOGIC
  if (selected === "tech") {
    // If we're in Tech but haven't selected a category, don't show anyone
    if (!selectedCategory) return false; 
    
    const selCat = selectedCategory.toLowerCase();

    // Check if the employee's category matches the selected one
    if (category === selCat) {
      
      // A) Developer Category (3-Tier structure)
      if (selCat === "developer") {
        
        // If 'Developer' is selected, we MUST have a sub-category selected from the UI
        if (!selectedSubCategory) return false; 
        
        // Match the subCategory from the UI against the employee's subCategory field
        return subCategory === selectedSubCategory.toLowerCase();
      } 
      
      // B) Other Tech Categories (2-Tier structure: e.g., DevOps, IT Admin)
      else {
        // For these single-tier categories:
        // 1. Ensure no subCategory is selected in the UI (since the list should appear directly).
        // 2. Ensure the employee's subCategory field is empty (as saved by the backend).
        return !selectedSubCategory && subCategory === ""; 
      }
    }
  }

  return false;
});
// ⚠️ END CORRECTED FILTERING LOGIC

  // --- Print Function ---
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-950 text-white py-10 px-5">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Employee Directory</h1>

        {/* Step 1: Team Selection */}
        {!selectedTeam && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {teams.map((team) => (
              <motion.div
                key={team}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedTeam(team)}
                className="bg-white/10 border border-white/20 p-6 rounded-2xl cursor-pointer text-center hover:bg-white/20 transition-all duration-300 shadow-xl"
              >
                <h2 className="text-xl font-semibold">{team}</h2>
              </motion.div>
            ))}
          </div>
        )}

        {/* Step 2: Tech Category Selection */}
        {selectedTeam === "Tech" && !selectedCategory && !selectedEmployee && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Tech Teams</h2>
              <button
                onClick={() => setSelectedTeam(null)}
                className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                ← Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {techCategories.map((cat) => (
                <motion.div
                  key={cat.name}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-xl"
                >
                  <h3
                    // If no children, click selects the category and proceeds to employee list
                    onClick={() => !cat.children && setSelectedCategory(cat.name)}
                    className={`text-xl font-semibold text-center ${
                      cat.children ? "mb-4" : "cursor-pointer hover:text-blue-400"
                    }`}
                  >
                    {cat.name}
                  </h3>

                  {cat.children && (
                    <div className="flex flex-col gap-3">
                      {cat.children.map((child) => (
                        <motion.div
                          key={child}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => {
                            setSelectedCategory(cat.name);
                            setSelectedSubCategory(child);
                          }}
                          className="bg-white/5 border border-white/10 rounded-xl text-center py-3 cursor-pointer hover:bg-white/20 transition-all duration-300"
                        >
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

        {/* Step 3: Employees Display */}
        {selectedTeam &&
          (selectedTeam !== "Tech" || selectedCategory) &&
          !selectedEmployee && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {selectedTeam === "Tech"
                    ? `${selectedSubCategory || selectedCategory} (${filteredEmployees.length})`
                    : `${selectedTeam} Team (${filteredEmployees.length})`}
                </h2>
                <button
                  onClick={() => {
                    if (selectedTeam !== "Tech") {
                        setSelectedTeam(null);
                    } else if (selectedSubCategory) {
                        // Go from SubCategory list back to Category selection
                        setSelectedSubCategory(null);
                    } else if (selectedCategory) {
                        // Go from Category list back to Tech team selection (or team selection if category is an entry point)
                        const categoryHasChildren = techCategories.find(c => c.name === selectedCategory)?.children;
                        if (categoryHasChildren) {
                             setSelectedCategory(null); // Back to category selection for developers
                        } else {
                            // Back to Tech team selection for non-developers (DevOps, IT Admin, etc.)
                            setSelectedCategory(null); 
                        }
                    } else {
                        setSelectedTeam(null);
                    }
                  }}
                  className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  ← Back
                </button>
              </div>

              {loading ? (
                <p className="text-center text-gray-400">Loading employees...</p>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-center text-gray-400">No employees found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredEmployees.map((emp) => (
                    <motion.div
                      key={emp._id}
                      whileHover={{ scale: 1.03 }}
                      onClick={() => setSelectedEmployee(emp)}
                      className="bg-white/10 border border-white/20 p-5 rounded-xl cursor-pointer hover:bg-white/20 transition-all duration-300 shadow-lg"
                    >
                      <div className="flex flex-col items-center text-center">
                        <img
                          src={emp.photo || "/default-avatar.png"}
                          alt={emp.name}
                          className="w-20 h-20 object-cover rounded-full mb-3 border-2 border-white/30"
                        />
                        <p className="text-lg font-semibold">{emp.name}</p>
                        <p className="text-sm text-gray-300">{emp.empId}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

        {/* Step 4: Employee Detail Popup */}
        <AnimatePresence>
          {selectedEmployee && (
            <motion.div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white text-gray-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-lg"
                >
                  ✕
                </button>

                <div className="flex flex-col items-center mb-6">
                  <img
                    src={selectedEmployee.photo || "/default-avatar.png"}
                    alt={selectedEmployee.name}
                    className="w-32 h-32 object-cover rounded-full mb-4 border-4 border-gray-200"
                  />
                  <h3 className="text-2xl font-bold">{selectedEmployee.name}</h3>
                  <p className="text-gray-600">{selectedEmployee.empId}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Info label="Father's Name" value={selectedEmployee.fatherName} />
                  <Info label="Date of Birth" value={selectedEmployee.dateOfBirth} />
                  <Info label="Joining Date" value={selectedEmployee.joiningDate} />
                  <Info label="Department" value={selectedEmployee.department} />
                  <Info label="Category" value={selectedEmployee.category} />
                  {/* Hide Sub Category if it's empty in the DB */}
                  {(selectedEmployee.subCategory && selectedEmployee.subCategory !== "N/A") && (
                    <Info label="Sub Category" value={selectedEmployee.subCategory} />
                  )}
                  <Info label="Phone" value={selectedEmployee.phoneNumber} />
                  <Info label="Email" value={selectedEmployee.mailId} />
                  <Info label="Account No." value={selectedEmployee.accountNumber} />
                  <Info label="IFSC Code" value={selectedEmployee.ifscCode} />
                </div>

                <div className="mt-8 text-center">
                  <button
                    onClick={handlePrint}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                  >
                    🖨️ Print / Download PDF
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Reusable Info Component
const Info = ({ label, value }: { label: string; value?: string }) => (
  <div className="bg-gray-100 rounded-xl p-4">
    <p className="text-xs text-gray-500 font-semibold uppercase">{label}</p>
    <p className="text-gray-900 font-medium">{value || "—"}</p>
  </div>
);