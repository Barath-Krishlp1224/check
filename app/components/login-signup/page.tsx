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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">

      <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-8 sm:p-10 w-full max-w-md">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Employee ID / Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID / Email
            </label>
            <input
              type="text"
              placeholder="EMP001 or email"
              value={form.empId}
              onChange={(e) => setForm({ ...form, empId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
            />

            <button
              type="button"
              onClick={handleForgotClick}
              className="text-sm text-gray-700 hover:underline mt-2 block text-right"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-3">
              <p className="text-gray-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
