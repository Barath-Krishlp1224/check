"use client";

import React from 'react';
import LeaveHistory from '../components/LeaveHistory'; // Adjust path based on where you saved the table
import { ArrowLeft } from 'lucide-react';

export default function HRLeavesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-12">
      <div className="max-w-6xl mx-auto">

        {/* Pass "all" or a specific ID. In HR mode, we'll assume "all" */}
        <LeaveHistory empIdOrEmail="all" />
      </div>
    </div>
  );
}