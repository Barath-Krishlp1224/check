"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login" || pathname === "/";

  if (isLoginPage) return null;

  const [userName, setUserName] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) document.addEventListener("mousedown", handler);
    else document.removeEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [isProfileOpen]);

  useEffect(() => {
    if (!userName) return;

    const fetchDepartment = async () => {
      try {
        const res = await fetch(`/api/employees?name=${encodeURIComponent(userName)}`, { cache: "no-store" });

        if (!res.ok) {
          setUserDepartment(localStorage.getItem("userDepartment") || null);
          return;
        }

        const data = await res.json();
        if (data?.success && data.employee) {
          setUserDepartment(
            data.employee.department ||
              data.employee.role ||
              localStorage.getItem("userDepartment") ||
              null
          );
          if (data.employee.department) {
            localStorage.setItem("userDepartment", data.employee.department);
          }
        } else {
          setUserDepartment(localStorage.getItem("userDepartment") || null);
        }
      } catch {
        setUserDepartment(localStorage.getItem("userDepartment") || null);
      }
    };

    fetchDepartment();
  }, [userName]);

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userDepartment");
    setIsProfileOpen(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* LOGO — NO HOVER COLOR */}
          <div className="flex items-center">
            <Link href="/">
              <div className="cursor-pointer">
                <Image src="/logo hd.png" alt="Logo" width={200} height={80} priority />
              </div>
            </Link>
          </div>

          {/* PROFILE DROPDOWN */}
          <div className="flex items-center">
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                onClick={() => setIsProfileOpen((p) => !p)}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {userName && (
                  <div className="flex flex-col">
                    <span className="text-gray-800 text-sm font-semibold">{userName}</span>
                    {userDepartment && (
                      <span className="text-gray-500 text-xs">{userDepartment}</span>
                    )}
                  </div>
                )}

                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-600 transition-all flex items-center space-x-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <span className="font-semibold text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
