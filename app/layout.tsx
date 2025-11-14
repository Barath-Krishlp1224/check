import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar/page";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          className="fixed top-0 left-0 w-full h-full object-cover -z-20"
        >
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Gradient Overlay */}
        <div
          className="fixed top-0 left-0 w-full h-full -z-10 opacity-90"
         style={{ background: "linear-gradient(-12deg, #0F2027 73%, #203A43 50%, #2C5364 50%)" }}
        ></div>

        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}