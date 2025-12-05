// app/layout.tsx

import type { Metadata } from "next";
import { Nunito_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/page";
import ConditionalNavbar from "./components/ConditionalNavbar";

// Primary font
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

// Keep mono font if needed
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lemonpay",
  description: "Admin, Manager, and Employees Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${nunitoSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-white text-gray-900`}
      >
        <ConditionalNavbar />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}