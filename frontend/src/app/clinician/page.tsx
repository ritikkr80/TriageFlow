import React from "react";
import { ClinicianQueue } from "@/components/clinician/ClinicianQueue";
import { Stethoscope } from "lucide-react";

export const metadata = {
  title: "Emergency Department Live Queue | TriageFlow",
};

export default function ClinicianPage() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Emergency Department Live Triage Queue
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
              Live Feed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active patients prioritized by ESI acuity with real-time deterministic safety triggers and 1-click review.
          </p>
        </div>
      </div>

      <ClinicianQueue />
    </div>
  );
}
