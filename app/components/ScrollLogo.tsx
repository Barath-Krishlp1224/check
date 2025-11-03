// app/components/ScrollLogo.tsx
"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";

const ScrollLogo: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide logo when scrolling down (more than 50px)
      if (currentScrollY > 50) {
        setIsVisible(false);
      } else {
        // Show logo when at top or scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div 
      className={`fixed top-4 left-6 z-30 transition-all duration-500 ease-in-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-8 pointer-events-none'
      }`}
    >
      <Link href="/" aria-label="Home">
        <div 
          className="h-16 w-64 bg-contain bg-no-repeat bg-center transition-opacity duration-300 hover:opacity-80 drop-shadow-lg"
          style={{ backgroundImage: `url('/logo hd.png')` }}
          aria-label="Company Logo" 
        ></div>
      </Link>
    </div>
  );
};

export default ScrollLogo;