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
  category?: string;
  subCategory?: string;
  department: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  photo?: string;
}

const teams = ["Tech", "Accounts", "HR", "Admin & Operations", "Housekeeping"];

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

export default function ViewEmpPage() {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(null);
  const [loading, setLoading] = useState(false);

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

  const filteredEmployees = employees.filter((emp) => {
    if (!selectedTeam) return false;

    const team = emp.team?.trim().toLowerCase();
    const category = emp.category?.trim().toLowerCase() || "";
    const subCategory = emp.subCategory?.trim().toLowerCase() || "";
    const selected = selectedTeam.trim().toLowerCase();

    // 1. Filter Non-Tech Teams (including Housekeeping)
    if (selected !== "tech") {
      return team === selected;
    }

    // 2. Filter Tech Team
    if (selected === "tech") {
      if (!selectedCategory) return false;
      
      const selCat = selectedCategory.toLowerCase();

      if (category === selCat) {
        if (selCat === "developer") {
          // Developer roles must match a specific sub-category
          if (!selectedSubCategory) return false;
          return subCategory === selectedSubCategory.toLowerCase();
        } else {
          // Non-developer roles (IT Admin, DevOps, etc.) must match the category
          // AND have no sub-category defined for the employee.
          return selectedSubCategory === null && !subCategory; 
        }
      }
    }

    return false;
  });

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-7xl mx-auto w-full py-8"> 
        {(selectedTeam || selectedCategory || selectedSubCategory) && (
          <nav className="mb-6 flex items-center gap-2 text-sm bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm mx-4 sm:mx-0">
            <button 
              className="text-blue-600 hover:text-blue-800 font-medium transition flex items-center gap-1"
              onClick={() => {
                setSelectedTeam(null);
                setSelectedCategory(null);
                setSelectedSubCategory(null);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </button>
            {selectedTeam && (
              <>
                <span className="text-gray-400">/</span>
                <button 
                  className={`${selectedCategory ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-900 font-semibold'} transition`}
                  onClick={() => {
                    if (selectedCategory) {
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                    }
                  }}
                >
                  {selectedTeam}
                </button>
              </>
            )}
            {selectedCategory && (
              <>
                <span className="text-gray-400">/</span>
                <button 
                  className={`${selectedSubCategory ? 'text-indigo-600 hover:text-indigo-800' : 'text-gray-900 font-semibold'} transition`}
                  onClick={() => {
                    if (selectedSubCategory) {
                      setSelectedSubCategory(null);
                    }
                  }}
                >
                  {selectedCategory}
                </button>
              </>
            )}
            {selectedSubCategory && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-semibold">{selectedSubCategory}</span>
              </>
            )}
          </nav>
        )}

        {!selectedTeam && (
          <div className="mx-4 sm:mx-0">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Department</h2>
              <p className="text-gray-600">Choose a department to view team members</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teams.map((team, idx) => {
                const teamCount = employees.filter(e => e.team?.toLowerCase() === team.toLowerCase()).length;
                return (
                  <motion.div
                    key={team}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTeam(team)}
                    className="bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:shadow-xl hover:border-blue-500 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-bold text-white">{team.charAt(0)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">{teamCount}</div>
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</div>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                        {team}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">Click to view team</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTeam === "Tech" && !selectedCategory && !selectedEmployee && (
          <div className="mx-4 sm:mx-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Technology Teams</h2>
                <p className="text-gray-600">Select a specialization or role</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all duration-300 font-semibold shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techCategories.map((cat) => {
                const catCount = employees.filter(e => e.category?.toLowerCase() === cat.name.toLowerCase()).length;
                return (
                  <motion.div
                    key={cat.name}
                    whileHover={{ scale: 1.03, y: -5 }}
                    className="bg-white border-2 border-gray-200 rounded-xl shadow-md hover:shadow-xl hover:border-blue-500 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="bg-blue-600 p-6">
                      <div className="flex items-center justify-between">
                        <h3
                          onClick={() => !cat.children && (setSelectedCategory(cat.name), setSelectedSubCategory(null))}
                          className={`text-xl font-bold text-white ${
                            cat.children ? "" : "cursor-pointer hover:scale-105 transition-transform"
                          }`}
                        >
                          {cat.name}
                        </h3>
                        {!cat.children && (
                          <div className="bg-white text-blue-600 text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                            {catCount}
                          </div>
                        )}
                      </div>
                    </div>

                    {cat.children ? (
                      <div className="p-5 space-y-3">
                        {cat.children.map((child) => {
                          const subCount = employees.filter(e => 
                            e.category?.toLowerCase() === cat.name.toLowerCase() && 
                            e.subCategory?.toLowerCase() === child.toLowerCase()
                          ).length;
                          return (
                            <motion.div
                              key={child}
                              whileHover={{ x: 6, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                setSelectedSubCategory(child);
                              }}
                              className="bg-gray-50 border-2 border-gray-200 rounded-lg px-5 py-4 cursor-pointer hover:bg-blue-50 hover:border-blue-500 hover:shadow-md transition-all duration-300 flex items-center justify-between group/item"
                            >
                              <span className="font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors">
                                {child}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">
                                  {subCount}
                                </span>
                                <svg className="w-5 h-5 text-gray-400 group-hover/item:text-blue-600 group-hover/item:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5">
                        <button
                          onClick={() => (setSelectedCategory(cat.name), setSelectedSubCategory(null))}
                          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          View Team
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTeam &&
          (selectedTeam !== "Tech" || selectedCategory) &&
          !selectedEmployee && (
            <div className="mx-4 sm:mx-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    {selectedTeam === "Tech"
                      ? selectedSubCategory || selectedCategory
                      : `${selectedTeam} Department`}
                  </h2>
                  <p className="text-gray-600 font-medium">
                    {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (selectedTeam !== "Tech") {
                      setSelectedTeam(null);
                    } else if (selectedSubCategory !== null) {
                      setSelectedSubCategory(null);
                    } else if (selectedCategory) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedTeam(null);
                    }
                  }}
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:border-indigo-300 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-200"></div>
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-indigo-600 border-t-transparent absolute top-0"></div>
                  </div>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300 shadow-md">
                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Employees Found</h3>
                  <p className="text-gray-600">There are no team members in this category yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredEmployees.map((emp, idx) => {
                    const gradients = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-emerald-500 to-teal-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-purple-500',
                      'from-rose-500 to-pink-500'
                    ];
                    const gradient = gradients[idx % gradients.length];
                    return (
                      <motion.div
                        key={emp._id}
                        whileHover={{ y: -8, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedEmployee(emp)}
                        className="bg-white/90 backdrop-blur-sm border-2 border-indigo-100 rounded-3xl cursor-pointer hover:shadow-2xl hover:border-indigo-400 transition-all duration-500 overflow-hidden group"
                      >
                        <div className={`h-2 bg-gradient-to-r ${gradient}`}></div>
                        <div className="p-6 flex flex-col items-center text-center">
                          <div className="relative mb-5">
                            <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-500`}></div>
                            <img
                              src={emp.photo || "/default-avatar.png"}
                              alt={emp.name}
                              className="relative w-24 h-24 object-cover rounded-full border-4 border-white shadow-xl"
                            />
                            <div className={`absolute -bottom-2 -right-2 w-7 h-7 bg-gradient-to-r ${gradient} rounded-full border-4 border-white shadow-lg`}></div>
                          </div>
                          <h4 className="text-lg font-extrabold text-gray-900 mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">{emp.name}</h4>
                          <p className={`text-sm font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-3`}>{emp.empId}</p>
                          <p className="text-xs font-semibold text-gray-600 bg-gradient-to-r from-gray-100 to-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">{emp.department}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        <AnimatePresence>
          {selectedEmployee && (
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
            >
              <motion.div
                className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl relative max-h-[95vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm hover:bg-red-500 hover:text-white text-gray-700 transition-all duration-300 z-10 font-bold text-2xl shadow-xl border-2 border-gray-200 hover:border-red-500"
                >
                  ×
                </button>

                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white px-8 pt-10 pb-8 rounded-t-3xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                  <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-3xl blur-xl opacity-60"></div>
                      <img
                        src={selectedEmployee.photo || "/default-avatar.png"}
                        alt={selectedEmployee.name}
                        className="relative w-36 h-36 object-cover rounded-3xl border-4 border-white shadow-2xl"
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-4xl font-extrabold mb-3 drop-shadow-lg">{selectedEmployee.name}</h3>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                        <span className="bg-white/25 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold shadow-lg border border-white/30">
                          {selectedEmployee.empId}
                        </span>
                        <span className="bg-white/25 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold shadow-lg border border-white/30">
                          {selectedEmployee.team}
                        </span>
                        {selectedEmployee.category && (
                          <span className="bg-white/25 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold shadow-lg border border-white/30">
                            {selectedEmployee.category}
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-100 font-medium">{selectedEmployee.department}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-indigo-50">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-900">Personal Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Info label="Father's Name" value={selectedEmployee.fatherName} />
                      <Info label="Date of Birth" value={selectedEmployee.dateOfBirth} />
                      <Info label="Joining Date" value={selectedEmployee.joiningDate} />
                      <Info label="Department" value={selectedEmployee.department} />
                      {selectedEmployee.category && (
                        <Info label="Category" value={selectedEmployee.category} />
                      )}
                      {selectedEmployee.subCategory && selectedEmployee.subCategory !== "N/A" && (
                        <Info label="Sub Category" value={selectedEmployee.subCategory} />
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-900">Contact Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Info label="Phone Number" value={selectedEmployee.phoneNumber} />
                      <Info label="Email Address" value={selectedEmployee.mailId} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-extrabold text-gray-900">Banking Details</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Info label="Account Number" value={selectedEmployee.accountNumber} />
                      <Info label="IFSC Code" value={selectedEmployee.ifscCode} />
                    </div>
                  </div>

                  <div className="flex justify-center pt-6">
                    <button
                      onClick={handlePrint}
                      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-10 py-4 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-bold shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 flex items-center gap-3 text-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div className="bg-white/80 backdrop-blur-sm border-2 border-indigo-100 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-300 hover:scale-105 transition-all duration-300">
    <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider mb-2">{label}</p>
    <p className="text-gray-900 font-bold text-base">{value || "—"}</p>
  </div>
);