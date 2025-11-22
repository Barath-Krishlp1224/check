"use client";

// 1. Import ToastContainer and toast
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // 2. Import CSS

type Role = "Admin" | "Manager" | "TeamLead" | "Employee";
type Team =
  | "Founders"
  | "Manager"
  | "TL-Reporting Manager"
  | "IT Admin"
  | "Tech"
  | "Accounts"
  | "HR"
  | "Admin & Operations";

export default function LoginPage() {
  const [form, setForm] = useState({ empId: "", password: "" });
  // Removed the local 'error' state since we'll use toast for errors
  const router = useRouter();

  // Helper function for showing validation errors
  const showValidationError = (message: string) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.empId) return showValidationError("Employee ID or Email is required.");
    if (!form.password) return showValidationError("Password is required.");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empIdOrEmail: form.empId,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Use toast.error for API errors (e.g., "Invalid credentials")
        const errorMessage = data.error || "Login failed. Please check your credentials.";
        return toast.error(errorMessage);
      }

      // 3. Use toast.success for successful login
      toast.success(data.message || "Login successful!", {
        onClose: () => {
          // Check for required user data after a successful response
          if (!data.user?.role || !data.user?.empId) {
            return toast.error("Login successful but required user data is missing.");
          }

          const userRole = data.user.role as Role;
          const userTeam = data.user.team as Team | undefined;

          // Store user data in localStorage
          localStorage.setItem("userRole", userRole);
          localStorage.setItem("userEmpId", data.user.empId);
          if (data.user.name) localStorage.setItem("userName", data.user.name);
          if (userTeam) localStorage.setItem("userTeam", userTeam);

          // Redirect logic after toast closes
          if (userRole === "Admin") router.push("/components/admin");
          else if (userRole === "Manager") router.push("/components/manager");
          else if (userRole === "TeamLead") router.push("/components/team-lead");
          else {
            switch (userTeam) {
              case "HR": router.push("/components/hr"); break;
              case "Accounts": router.push("/components/accounts"); break;
              case "Admin & Operations": router.push("/components/admin-operations"); break;
              case "Tech": router.push("/components/view-task"); break;
              case "IT Admin": router.push("/components/it-admin"); break;
              case "Founders": router.push("/components/founders"); break;
              case "Manager": router.push("/components/manager"); break;
              case "TL-Reporting Manager": router.push("/components/team-lead"); break;
              default: router.push("/components/home");
            }
          }
        },
        autoClose: 1000, // Optional: Short autoClose to redirect quicker
      });
    } catch {
      // Use toast.error for network errors
      toast.error("Network error. Try again later.");
    }
  };

  const handleForgotClick = () => {
    router.push("/components/forgot-password");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-white">
      {/* 4. Add ToastContainer to the root of your component's return */}
      <ToastContainer position="top-right" autoClose={5000} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl p-8 sm:p-12 w-full max-w-md border border-white/20 shadow-[0_0_30px_8px_rgba(44,62,80,0.45)]">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-[#2c3e50]">Welcome Back...</h2>
          <p className="mt-5 text-[#2c3e50]">Sign in to access your dashboard</p>
        </div>

        <div className="space-y-6">
          {/* Employee ID / Email */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Employee ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400 transition-colors"
                  fill="none"
                  stroke="#2c3e50"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="EMP001 or email@company.com"
                value={form.empId}
                onChange={(e) => setForm({ ...form, empId: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-[#2c3e50] rounded-xl 
                text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2c3e50] 
                focus:ring-2 focus:ring-[#2c3e50] transition-all duration-300"
              />
            </div>
          </div>

          {/* Password */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400 transition-colors"
                  fill="none"
                  stroke="#2c3e50"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-[#2c3e50] rounded-xl
                text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#2c3e50] 
                focus:ring-2 focus:ring-[#2c3e50] transition-all duration-300"
              />
            </div>

            <div className="text-right mt-3">
              <button
                type="button"
                onClick={handleForgotClick}
                className="text-sm text-[#2c3e50] hover:text-[#2c3e50] font-semibold transition-colors duration-200 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Removed the static error message div */}
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            className="w-full text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: "#2c3e50" }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}