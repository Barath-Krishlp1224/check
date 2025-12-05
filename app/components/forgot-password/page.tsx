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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap");

        /* Keeping font styles, removing animations */
        .font-poppins {
          font-family: "Poppins", sans-serif;
        }
        .font-inter {
          font-family: "Inter", sans-serif;
        }
        .font-playfair {
          font-family: "Playfair Display", serif;
        }
        .font-space {
          font-family: "Space Grotesk", sans-serif;
        }
        .font-montserrat {
          font-family: "Montserrat", sans-serif;
        }
      `}</style>

      {/* --- Section 1: Form (Left) - Unchanged --- */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 font-poppins">
              Forgot Password?
            </h2>
            <p className="text-gray-600 font-inter">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-montserrat">
                Employee ID or Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="empIdOrEmail"
                  placeholder="EMP12345 or your@lemonpay.tech"
                  value={form.empIdOrEmail}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-inter"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                <p className="text-red-800 text-sm font-medium font-inter">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                <p className="text-green-800 text-sm font-medium font-inter">{message}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none font-poppins"
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
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-poppins"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
      {/* --- END Section 1 --- */}


      {/* --- Section 2: Animated Background (Now on Right, Right Aligned) --- */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 p-12 flex-col relative overflow-hidden rounded-bl-full">
        
        {/* Placeholder for Background Video */}
        <div className="absolute inset-0 opacity-20">
          {/* Using a static pattern to simulate the complexity of a background video */}
          <div className="absolute inset-0 bg-repeat" 
               style={{ 
                 backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")',
               }} 
          />
          {/* Video element placeholder: UNCOMMENT and replace 'YOUR_VIDEO_URL' with the actual video file (e.g., .mp4) */}
          
          <video autoPlay loop muted className="w-full h-full rounded-bl-full object-cover">
            <source src="/2 copy.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
         
        </div>
        <div className="absolute inset-0rounded-bl-full bg-slate-900/40" aria-hidden="true" />
        {/* END Placeholder for Background Video */}

        <div className="relative z-10 flex flex-col h-full text-right">
          <div className="flex-grow flex flex-col justify-center items-end">
            
            {/* Logo - Right Aligned */}
            <div className="flex-shrink-0 mb-12">
              <div className="rounded-2xl p-4 inline-block ">
                
                  <img
                    src="/logo hd.png"
                    alt="Company logo"
                    className="w-100 h-30 object-contain"
                  />
                
              </div>
            </div>

            {/* Content - Right Aligned */}
            <div className="max-w-md w-full">
              
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight font-montserrat">
                Secure Password
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-space">
                  Recovery
                </span>
              </h1>
              <p className="text-white text-lg leading-relaxed mb-12 max-w-md ml-auto font-inter opacity-90">
                We'll help you regain access to your Lemonpay account quickly and securely. Enter your credentials and we'll send you a password reset link.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* --- END Section 2 --- */}
    </div>
  );
}