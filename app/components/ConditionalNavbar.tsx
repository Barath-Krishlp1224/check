"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar/page";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Routes where navbar should be hidden
  const hideNavbarRoutes = [
    "/components/forgot-password",
    "/forgot-password",
    "/components/login-signup",
    "/login-signup",
    "/reset-password",
    "/components/reset-password"
  ];
  
  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (shouldHideNavbar) {
    return null;
  }
  
  return <Navbar />;
}