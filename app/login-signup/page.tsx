"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "Admin" | "Manager" | "TeamLead" | "Employee" | "";

export default function LoginSignupPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ 
    name: "", 
    empId: "", 
    email: "", 
    password: "" 
  });
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [role, setRole] = useState<Role>(""); 
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.empId && !isSignup) { 
        setError("Employee ID or Email is required.");
        return;
    }
    
    if (isSignup) {
      if (!form.name) {
        setError("Full Name is required for signup.");
        return;
      }
      if (!form.empId) {
        setError("Employee ID is required for signup.");
        return;
      }
      if (!form.email) { 
        setError("Email is required for signup.");
        return;
      }
      if (!role) { 
        setError("Role is required for signup.");
        return;
      }
      if (form.password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    const endpoint = isSignup ? "/api/signup" : "/api/login";

    try {
      let payload;
      if (isSignup) {
        payload = { 
          name: form.name, 
          empId: form.empId, 
          email: form.email,
          password: form.password,
          role: role, 
        };
      } else {
        payload = { 
          empIdOrEmail: form.empId, 
          password: form.password 
        };
      }

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

      alert(data.message);

      if (!isSignup) {
        if (data.user && data.user.role && data.user.empId) { 
            const userRole = data.user.role as Role;
            
            localStorage.setItem("userRole", userRole);
            localStorage.setItem("userEmpId", data.user.empId);
            
            if(data.user.name) {
                localStorage.setItem("userName", data.user.name); 
            }
            
            if (userRole === "Admin") {
                router.push("/admin"); 
            } else if (userRole === "Manager") {
                router.push("/manager"); 
            } else if (userRole === "TeamLead") {
                router.push("/team-lead"); 
            } else if (userRole === "Employee") {
                router.push("/employees"); 
            } else {
                router.push("/home");  
            }

        } else {
             setError("Login successful but required user data is missing (Role or Employee ID)."); 
             return;
        }
        
        return; 

      } else {
        setIsSignup(false);
        setForm({ name: "", empId: "", email: "", password: "" });
        setConfirmPassword(""); 
        setRole(""); 
      }
      
    } catch (err) {
      console.error(err);
      setError("Network error. Try again later.");
    }
  };
  
  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
    setForm({ name: "", empId: "", email: "", password: "" });
    setConfirmPassword(""); 
    setRole(""); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-20 p-4">
      
      <div className="absolute top-0 left-0 p-6 z-30">
        <img 
          src="/logo hd.png" 
          alt="Lemonpay Logo"
          className="h-auto w-60 drop-shadow-lg" 
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/60 backdrop-blur-md shadow-2xl rounded-2xl p-8 sm:p-10 w-full max-w-md border border-blue-100/50">
     
        <div className="mt-2 mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-wide">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-600 text-sm">
            {isSignup ? "Fill in your details to get started" : "Enter your credentials to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {isSignup && (
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-black mb-1.5">Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                        required
                    />
                </div>
                
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-black mb-1.5">Employee ID</label>
                    <input
                        type="text"
                        placeholder="EMP12345"
                        value={form.empId}
                        onChange={(e) => setForm({ ...form, empId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                        required
                    />
                </div>
            </div>
          )}

          {!isSignup && (
            <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Employee ID or Email</label>
                <input
                    type="text"
                    placeholder="EMP12345 or Email Address" 
                    value={form.empId}
                    onChange={(e) => setForm({ ...form, empId: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                    required
                />
            </div>
          )}

          {isSignup && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled className='text-gray-400'>Choose your role...</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="TeamLead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </>
          )}

          <div className={`flex flex-col gap-4 ${isSignup ? 'sm:flex-row' : ''}`}>
            <div className="relative flex-1">
              <label className="block text-sm font-medium text-black mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                required
              />
            </div>
            
            {isSignup && (
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-black mb-2">Confirm Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner"
                        required
                    />
                </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 rounded-xl p-3">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/20 transform hover:scale-[1.005]"
          >
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="h-px bg-gray-300 flex-1"></div>
          </div>
          
          <p className="text-gray-600 text-sm">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-black font-semibold hover:underline transition-all"
            >
              {isSignup ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}