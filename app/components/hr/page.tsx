'use client';

import React from 'react';
import Link from 'next/link';

// Renamed function to HRPortal as requested
const HRPortal = () => {
  // Common Tailwind classes for the button style
  const buttonClasses = `
    w-full h-20 text-base font-semibold cursor-pointer 
    rounded-xl border border-gray-200 bg-white text-black 
    shadow-md transition-all duration-300 ease-in-out 
    flex items-center justify-center text-center px-5
    hover:scale-105 hover:shadow-xl
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
  `;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-5">
      <div className="max-w-6xl w-full">
        {/* Left-aligned content section */}
        <div className="text-left mb-12">
          {/* Main Heading: Left Aligned */}
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">
            Welcome to HR Portal
          </h1>
          
          {/* Subheading: Left Aligned */}
          <p className="text-xl text-gray-600">
            Choose your next action
          </p>
        </div>
        
        {/* Grid Container for Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          {/* 1. Attendance Button */}
          <Link href="/components/attendance/allday" passHref>
            <button className={buttonClasses}>
              Attendance
            </button>
          </Link>
          
          {/* 2. Task View Button */}
          <Link href="/components/hr/task-view" passHref>
            <button className={buttonClasses}>
              Task Management
            </button>
          </Link>
          
          {/* 3. Overall Calculation Button */}
          <Link href="/components/hr/Payroll-Calculation" passHref>
            <button className={buttonClasses}>
              Payroll Calculation
            </button>
          </Link>
          
          {/* 4. Sand Dunes / Employee Data Button */}
          <Link href="/tours/desert-safari" passHref>
            <button className={buttonClasses}>
              Employee Directory
            </button>
          </Link>

          {/* Optional: Add a 5th button to fill out the 5-column grid on larger screens */}
          <Link href="/components/onboarding" passHref>
            <button className={buttonClasses}>
              Onboarding/Offboarding
            </button>
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default HRPortal;