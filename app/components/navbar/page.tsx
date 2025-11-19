"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  // Hide navbar on login page and root path
  const isLoginPage = pathname === "/login" || pathname === "/";
  if (isLoginPage) {
    return null;
  }

  // 👤 Username
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("userName");
      if (storedName) setUserName(storedName);
    }
  }, []);

  // 👤 Profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userName");
    }
    setIsProfileOpen(false);
    router.push("/");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-[#3A6073]/30 shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, #0F2027 73%, #203A43 50%, #2C5364 50%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-23">

          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="relative opacity-90 hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                <Image
                  src="/logo hd.png"
                  alt="Logo"
                  width={200}
                  height={80}
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">

            <div className="hidden md:block w-px h-6 bg-white/20"></div>

            {/* USERNAME + PROFILE ICON */}
            <div className="relative flex items-center space-x-2" ref={profileRef}>


              {/* Profile icon */}
              <button
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200"
                onClick={() => setIsProfileOpen((prev) => !prev)}
              >
                <div className="relative w-6 h-6">
                  <Image
                    src="/icon.png"
                    alt="Profile"
                    layout="fill"
                    objectFit="contain"
                    className="opacity-80 hover:opacity-100"
                  />
                </div>
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-2 text-sm">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 text-slate-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
              {/* 👤 Username (outside dropdown, clean) */}
              {userName && (
                <span className="text-white text-sm font-medium tracking-wide">
                  {userName}
                </span>
              )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;