"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Activity, ShieldCheck, Stethoscope, UserCheck, Settings } from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Overview", icon: Activity },
    { href: "/patient", label: "Patient Intake", icon: UserCheck },
    { href: "/clinician", label: "Clinician ED Queue", icon: Stethoscope },
    { href: "/admin", label: "Admin & Audit", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-36 sm:w-44 flex items-center">
              <Image
                src="/logo.png"
                alt="TriageFlow AI Logo"
                width={176}
                height={48}
                priority
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Status Pill */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Safety Rules Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
