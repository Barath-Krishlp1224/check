"use client";

import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

const Chat = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8 inline-block">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
            <Clock className="w-16 h-16 text-white" strokeWidth={2} />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-purple-500 animate-bounce" />
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-4">
          Coming Soon
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-xl mb-8 leading-relaxed">
          We're working hard to bring you something amazing. This feature will be available shortly!
        </p>

        {/* Decorative Line */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-1 w-16 bg-gradient-to-r from-transparent to-purple-500 rounded-full"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
          <div className="h-1 w-16 bg-gradient-to-l from-transparent to-purple-500 rounded-full"></div>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-md mx-auto">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-progress"></div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Development in progress...</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 0%;
          }
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Chat;