"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.empId) return setError("Employee ID or Email is required.");
    if (!form.password) return setError("Password is required.");

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
      if (!res.ok) return setError(data.error || "Something went wrong");

      alert(data.message || "Login successful");

      if (!data.user?.role || !data.user?.empId) {
        return setError("Login successful but required user data is missing.");
      }

      const userRole = data.user.role as Role;
      const userTeam = data.user.team as Team | undefined;

      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userEmpId", data.user.empId);

      if (data.user.name) localStorage.setItem("userName", data.user.name);
      if (userTeam) localStorage.setItem("userTeam", userTeam);

      if (userRole === "Admin") router.push("/components/admin");
      else if (userRole === "Manager") router.push("/components/manager");
      else if (userRole === "TeamLead") router.push("/components/team-lead");
      else {
        switch (userTeam) {
          case "HR": router.push("/components/hr"); break;
          case "Accounts": router.push("/components/accounts"); break;
          case "Admin & Operations": router.push("/components/admin-operations"); break;
          case "Tech": router.push("/components/employees"); break;
          case "IT Admin": router.push("/components/it-admin"); break;
          case "Founders": router.push("/components/founders"); break;
          case "Manager": router.push("/components/manager"); break;
          case "TL-Reporting Manager": router.push("/components/team-lead"); break;
          default: router.push("/components/home");
        }
      }
    } catch {
      setError("Network error. Try again later.");
    }
  };

  const handleForgotClick = () => {
    router.push("/components/forgot-password");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-white">
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

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-600 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

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
