"use client";

import { useRouter } from "next/navigation";
import React from 'react';
import { Construction } from 'lucide-react';

interface ContentComponentProps {
    path: string;
}

export default function AssetManagement({ path }: ContentComponentProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] mt-30">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl border-4 border-dashed border-indigo-200 p-10 text-center">
        <Construction className="w-16 h-16 text-indigo-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-extrabold text-indigo-700 mb-2">Coming Soon</h2>
        <p className="text-lg text-gray-600 mb-6">
          The Asset Management feature is currently under construction.
        </p>
        <p className="text-sm text-gray-500">
          We are working hard to bring you the best tools to track and manage company assets. Please check back later!
        </p>
      </div>
    </div>
  );
}