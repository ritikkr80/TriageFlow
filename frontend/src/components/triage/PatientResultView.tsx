"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertCircle, Clock, MapPin, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { TriageAssessmentResult } from "@/types/triage";
import { getEsiBadge } from "@/lib/utils";

interface PatientResultViewProps {
  assessment: TriageAssessmentResult;
  patientName: string;
  chiefComplaint: string;
  sessionId: string;
  onReset: () => void;
}

export const PatientResultView: React.FC<PatientResultViewProps> = ({
  assessment,
  patientName,
  chiefComplaint,
  sessionId,
  onReset,
}) => {
  const esi = getEsiBadge(assessment.esiLevel);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className={`p-6 border-b ${esi.bg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${esi.badge}`}>
                Triage Priority Level
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                {assessment.acuityLabel}
              </h1>
              <p className="text-sm font-medium opacity-90 mt-1">
                Patient: <span className="font-bold">{patientName}</span> &bull; Complaint: &ldquo;{chiefComplaint}&rdquo;
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur px-4 py-3 rounded-xl border border-slate-200/60 shadow-sm text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase justify-center">
                <Clock className="w-3.5 h-3.5" />
                <span>Target Evaluation</span>
              </div>
              <p className="text-lg font-black text-slate-900 mt-0.5">{esi.urgency}</p>
            </div>
          </div>
        </div>

        {/* Layperson Explanation */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">What this means for you</h3>
            <p className="text-slate-700 text-base leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {assessment.patientExplanation}
            </p>
          </div>

          {/* Recommended Destination & Re-check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-blue-900">Recommended Routing</h4>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{assessment.recommendedRouting}</p>
                <p className="text-xs text-blue-700 mt-1">Report to this designated care zone when called.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-amber-900">Re-Assessment Policy</h4>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  Every {assessment.reassessmentIntervalMinutes} Minutes
                </p>
                <p className="text-xs text-amber-700 mt-1">Notify staff immediately if you feel worse before your timer.</p>
              </div>
            </div>
          </div>

          {/* Primary Clinical Drivers */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Key Assessment Factors</h3>
            <div className="space-y-2">
              {assessment.primaryDrivers.map((driver, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-100/80 px-3 py-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{driver}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Red flags (if any) */}
          {assessment.detectedRedFlags.length > 0 && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Deterministic Red Flags Logged:</span>
              </div>
              <ul className="space-y-1.5">
                {assessment.detectedRedFlags.map((rf, idx) => (
                  <li key={idx} className="text-xs text-red-800 flex items-start gap-2">
                    <span className="font-semibold">{rf.description}</span> ({rf.triggeredBy})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinician Human-in-the-loop Notice */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-300 uppercase">Human Oversight Guaranteed</p>
                <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                  This case has been logged into the live Clinician Queue (Session ID: <code className="text-blue-300 font-mono">{sessionId.slice(-6)}</code>).
                </p>
              </div>
            </div>
            <Link
              href="/clinician"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors"
            >
              View Clinician Queue &rarr;
            </Link>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3.5 bg-slate-100 rounded-lg text-slate-500 text-[11px] leading-relaxed border border-slate-200">
            {assessment.safetyDisclaimer}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Start New Intake</span>
          </button>

          <Link
            href="/clinician"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-all"
          >
            Open Clinician Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
