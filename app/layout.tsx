// app/layout.tsx
import React from "react";
import Link from "next/link";
import "./globals.css";
import ScrollLogo from "./components/ScrollLogo";

export const metadata = {
  title: "Company Portal",
  description: "Admin, Manager, and Employees Dashboard",
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Import Google Font */}
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: 'M PLUS Rounded 1c', sans-serif;
          }
          .nav-link {
            position: relative;
            display: inline-block;
          }
          .nav-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -2px;
            left: 0;
            background-color: white; 
            transition: width 0.3s ease-in-out;
            border-radius: 9999px; 
          }
          .nav-link:hover::after {
            width: 100%;
          }
          
          /* Glacier Glass Effect */
          .glacier-glass {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(12px) saturate(180%);
            -webkit-backdrop-filter: blur(12px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
              inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 0 rgba(255, 255, 255, 0.2);
          }
          
          /* Optional: Add subtle shimmer effect */
          .glacier-glass::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            animation: shimmer 3s infinite;
          }
          
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </head>
      <body className="relative min-h-screen w-screen bg-gray-100"> 
        
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="/2.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Logo with Scroll Detection */}
        <ScrollLogo />
        
        {/* Page Content (children) */}
        <main className="relative z-20">
          {children}
        </main>
      </body>
    </html>
  );
};

export default Layout;