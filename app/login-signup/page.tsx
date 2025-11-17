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

      // Navigation logic
      if (userRole === "Admin") router.push("/admin");
      else if (userRole === "Manager") router.push("/manager");
      else if (userRole === "TeamLead") router.push("/team-lead");
      else {
        switch (userTeam) {
          case "HR":
            router.push("/hr");
            break;
          case "Accounts":
            router.push("/accounts");
            break;
          case "Admin & Operations":
            router.push("/admin-operations");
            break;
          case "Tech":
            router.push("/employees");
            break;
          case "IT Admin":
            router.push("/it-admin");
            break;
          case "Founders":
            router.push("/founders");
            break;
          case "Manager":
          case "TL-Reporting Manager":
            router.push("/manager");
            break;
          default:
            router.push("/home");
        }
      }
    } catch {
      setError("Network error. Try again later.");
    }
  };

  // 👇 Redirect when user clicks forgot password
  const handleForgotClick = () => {
    router.push("/components/forgot-password");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-20 p-4">


      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Card */}
      <div className="relative bg-white/60 backdrop-blur-md shadow-2xl rounded-2xl p-8 sm:p-10 w-full max-w-md border border-blue-100/50">
        <div className="mt-2 mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-wide">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-sm">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee ID / Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Employee ID or Email</label>
            <input
              type="text"
              placeholder="EMP12345 or Email Address"
              value={form.empId}
              onChange={(e) => setForm({ ...form, empId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
            />

            {/* 🌟 Forgot Password Link */}
            <button
              type="button"
              onClick={handleForgotClick}
              className="text-sm text-blue-700 hover:text-blue-900 underline mt-2 block text-right"
            >
              Forgot Password?
            </button>
          </div>

          {/* Error msg */}
          {error && (
            <div className="bg-red-100 border border-red-400 rounded-xl p-3">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/20 transform hover:scale-[1.005]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
