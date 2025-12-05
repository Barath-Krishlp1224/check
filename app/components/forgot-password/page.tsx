"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft, Mail, Shield } from "lucide-react";

export default function ForgotPasswordForm() {
  const [form, setForm] = useState({
    empIdOrEmail: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.empIdOrEmail.trim()) {
      setError("Employee ID or Lemonpay email is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empIdOrEmail: form.empIdOrEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to send reset link.");
        return;
      }

      setMessage(
        data.message ||
          "If an account exists with this ID or email, a reset link has been sent."
      );

      setTimeout(() => {
        router.push("/components/login-signup");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push("/components/login-signup");
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 shadow-2xl rounded-2xl overflow-hidden bg-white">
        
        {/* Left Side - Illustration/Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Secure Password Recovery
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              We'll help you regain access to your Lemonpay account quickly and securely. Enter your credentials and we'll send you a password reset link.
            </p>
            
            <div className="space-y-4">
             
              
              <div className="flex items-start gap-3">
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 bg-white">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h2>
            <p className="text-gray-600">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employee ID or Email Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="empIdOrEmail"
                  placeholder="EMP12345 or your@lemonpay.tech"
                  value={form.empIdOrEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                <p className="text-green-800 text-sm font-medium">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3.5 rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}