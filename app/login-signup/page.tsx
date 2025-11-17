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
  const [form, setForm] = useState({
    empId: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.empId) {
      setError("Employee ID or Email is required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    const endpoint = "/api/login";

    try {
      const payload = {
        empIdOrEmail: form.empId,
        password: form.password,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      alert(data.message || "Login successful");

      if (data.user && data.user.role && data.user.empId) {
        const userRole = data.user.role as Role;
        const userEmpId = data.user.empId as string;
        const userName = data.user.name as string | undefined;
        const userTeam = data.user.team as Team | undefined;

        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userEmpId", userEmpId);

        if (userName) {
          localStorage.setItem("userName", userName);
        }

        if (userTeam) {
          localStorage.setItem("userTeam", userTeam);
        }

        // Role-based + team-based routing
        if (userRole === "Admin") {
          router.push("/admin");
        } else if (userRole === "Manager") {
          router.push("/manager");
        } else if (userRole === "TeamLead") {
          router.push("/team-lead");
        } else {
          // Employee → route by team
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
              router.push("/employees"); // or "/tech"
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
      } else {
        setError(
          "Login successful but required user data is missing (Role or Employee ID)."
        );
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again later.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-20 p-4">
      {/* Logo */}
      <div className="absolute top-0 left-0 p-6 z-30">
        <img
          src="/logo hd.png"
          alt="Lemonpay Logo"
          className="h-auto w-60 drop-shadow-lg"
        />
      </div>

      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Card */}
      <div className="relative bg-white/60 backdrop-blur-md shadow-2xl rounded-2xl p-8 sm:p-10 w-full max-w-md border border-blue-100/50">
        {/* Header */}
        <div className="mt-2 mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-wide">
            Welcome Back
          </h2>
          <p className="text-gray-600 text-sm">
            Enter your credentials to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee ID / Email */}
          <div className="relative">
            <label className="block text-sm font-medium text-black mb-2">
              Employee ID or Email
            </label>
            <input
              type="text"
              placeholder="EMP12345 or Email Address"
              value={form.empId}
              onChange={(e) => setForm({ ...form, empId: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 rounded-xl p-3">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Submit Button */}
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
