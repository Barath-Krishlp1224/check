"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const pathname = usePathname();
  
  // Hide navbar on login page and root path
  const isLoginPage = pathname === "/login" || pathname === "/";
  
  if (isLoginPage) {
    return null;
  }

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-[#3A6073]/30 shadow-lg" 
      style={{background: 'linear-gradient(135deg, #0F2027 73%, #203A43 50%, #2C5364 50%)'}}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Flex Container: This ensures Logo (start), Nav Links (center), and Icons (end) are spaced correctly */}
        <div className="flex items-center justify-between h-23">
          
          {/* Left - Logo */}
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

          {/* Center - Nav Links (Hidden on small screens) */}
          <div className="hidden md:flex items-center space-x-8">
            
            {/* Home Link */}
            <Link
              href="/dashboard"
              className="relative text-gray-200 font-medium hover:text-white transition-colors duration-200 group"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* About Link */}
            <Link
              href="/about"
              className="relative text-gray-200 font-medium hover:text-white transition-colors duration-200 group"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>About</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Contact Link */}
            <Link
              href="/contact"
              className="relative text-gray-200 font-medium hover:text-white transition-colors duration-200 group"
            >
              <span className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* Right - Custom Image Icons */}
          <div className="flex items-center space-x-1">
            
            <div className="hidden md:block w-px h-6 bg-white/20 mx-2"></div>
           
            {/* Notification Button (Bell Icon) */}
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all duration-200">
              {/* Notification Badge */}
              <div className="relative w-6 h-6">
                <Image
                  src="/bell.png" // Replace with the actual path to your bell icon
                  alt="Notifications"
                  layout="fill"
                  objectFit="contain"
                  className="opacity-80 hover:opacity-100"
                />
              </div>
            </button>

            {/* Profile Button (Person Icon) */}
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200">
              <div className="relative w-6 h-6">
                <Image
                  src="/icon.png" // Replace with the actual path to your profile icon
                  alt="Profile"
                  layout="fill"
                  objectFit="contain"
                  className="opacity-80 hover:opacity-100"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;