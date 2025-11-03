"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// UPDATED: Added "TeamLead" to the Role type
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

    if (!form.empId) {
        setError("Employee ID is required.");
        return;
    }
    
    if (isSignup) {
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
        // NOTE: This payload assumes your backend can handle either empId or email
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
        // 🔑 Successful Login Logic to save empId and handle routing
        if (data.user && data.user.role && data.user.empId) { 
            const userRole = data.user.role as Role;
            
            // Save user data to local storage
            localStorage.setItem("userRole", userRole);
            localStorage.setItem("userEmpId", data.user.empId);
            
            if(data.user.name) {
                localStorage.setItem("userName", data.user.name); 
            }
            
            // 🎯 CONDITIONAL ROUTING LOGIC FINALIZED
            if (userRole === "Admin") {
                router.push("/admin"); 
            } else if (userRole === "Manager") {
                router.push("/manager"); 
            } else if (userRole === "TeamLead") {
                router.push("/team-lead"); 
            } else if (userRole === "Employee") {
                // Redirect Employee directly to the task page
                router.push("/employees"); 
            } else {
                // Fallback for any unknown role (could also be changed to "/")
                router.push("/home");  
            }

        } else {
             // This branch indicates a backend data issue (missing role/empId)
             setError("Login successful but required user data is missing (Role or Employee ID)."); 
             return;
        }
        
        return; 

      } else {
        // Successful Signup: reset fields and switch to Login view
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
    <div className="flex items-center justify-center min-h-screen p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 w-full max-w-md border border-slate-200/50">
     

        <div className="mt-6 mb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-slate-500 text-sm">
            {isSignup ? "Fill in your details to get started" : "Enter your credentials to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignup && (
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        required
                    />
                </div>
                
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee ID</label>
                    <input
                        type="text"
                        placeholder="EMP12345"
                        value={form.empId}
                        onChange={(e) => setForm({ ...form, empId: e.target.value })}
                        className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        required
                    />
                </div>
            </div>
          )}

          {!isSignup && (
            <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <input
                    type="text"
                    // NOTE: Placeholder updated to suggest EmpId/Email is expected
                    placeholder="EMP12345 or Email" 
                    value={form.empId}
                    onChange={(e) => setForm({ ...form, empId: e.target.value })}
                    className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                    required
                />
            </div>
          )}

          {isSignup && (
            <>
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="john.doe@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="" disabled>Choose your role...</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  {/* ADDED: New Role Option in the UI */}
                  <option value="TeamLead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>
            </>
          )}

          <div className={`flex flex-col gap-4 ${isSignup ? 'sm:flex-row' : ''}`}>
            <div className="relative flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                required
              />
            </div>
            
            {isSignup && (
                <div className="relative flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3.5 text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                        required
                    />
                </div>
            )}
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold py-4 rounded-xl hover:from-slate-800 hover:to-slate-950 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="h-px bg-slate-300 flex-1"></div>
            <span className="px-4 text-sm text-slate-500">or</span>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>
          
          <p className="text-slate-600 text-sm">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-slate-800 font-semibold hover:underline transition-all"
            >
              {isSignup ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
