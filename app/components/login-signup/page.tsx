"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

type Team = "Founders" | "Manager" | "TL-Reporting Manager" | "IT Admin" | "Tech" | "Accounts" | "HR" | "Admin & Operations";

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
          case "HR":
            router.push("/components/hr");
            break;
          case "Accounts":
            router.push("/components/accounts");
            break;
          case "Admin & Operations":
            router.push("/components/admin-operations");
            break;
          case "Tech":
            router.push("/components/employees");
            break;
          case "IT Admin":
            router.push("/components/it-admin");
            break;
          case "Founders":
            router.push("/components/founders");
            break;
          case "Manager":
            router.push("/components/manager");
            break;
          case "TL-Reporting Manager":
            router.push("/components/team-lead");
            break;
          default:
            router.push("/components/home");
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-slate-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="bg-white/90 backdrop-blur-lg border border-slate-200 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-600 text-sm mt-2">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Employee ID / Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Employee ID / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="EMP001 or email@company.com"
                value={form.empId}
                onChange={(e) => setForm({ ...form, empId: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleForgotClick}
              // UPDATED: text-slate-900 (dark base color) and hover:text-black (pure black on hover).
              // block text-right ensures it is aligned to the right.
              className="text-sm text-slate-900 hover:text-black font-medium mt-2 block text-right transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            Sign In
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}