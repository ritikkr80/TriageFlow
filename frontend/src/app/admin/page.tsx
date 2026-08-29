"use client";

import React, { useState } from "react";
import { AdminAuditView } from "@/components/admin/AdminAuditView";
import { AdminConfigView } from "@/components/admin/AdminConfigView";
import { Shield, Sliders, Activity } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "config">("audit");

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          System Administration & Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Audit logs, AI inference provider settings, and deterministic clinical safety rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "audit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Audit Logs & Compliance</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "config"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>AI Model & Safety Rule Config</span>
        </button>
      </div>

      {activeTab === "audit" ? <AdminAuditView /> : <AdminConfigView />}
    </div>
  );
}
