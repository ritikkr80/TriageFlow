"use client";

import React, { useState } from "react";
import { X, ShieldCheck, AlertTriangle, CheckCircle, ArrowRightLeft, Clock, User, Activity, Loader2 } from "lucide-react";
import { TriageSessionItem } from "@/types/triage";
import { getEsiBadge } from "@/lib/utils";

interface ClinicianReviewDrawerProps {
  session: TriageSessionItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const OVERRIDE_REASONS = [
  "Atypical presentation in elderly / immunocompromised patient",
  "High-risk vital sign trend observed at bedside",
  "Bedside clinical exam reveals higher acuity distress",
  "Significant past medical history elevates clinical risk",
  "Low resource requirement - patient suitable for Fast Track",
  "Patient condition improved / vital parameters stabilized",
  "Other clinical judgment override (see notes)",
];

export const ClinicianReviewDrawer: React.FC<ClinicianReviewDrawerProps> = ({ session, onClose, onSuccess }) => {
  const [isOverrideMode, setIsOverrideMode] = useState<boolean>(false);
  const [selectedOverrideEsi, setSelectedOverrideEsi] = useState<number>(2);
  const [overrideReason, setOverrideReason] = useState<string>(OVERRIDE_REASONS[0]);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const currentEsi = session.assessment?.esiLevel || 3;
  const currentBadge = getEsiBadge(currentEsi);

  // Submit Clinician Confirmation or Override
  const handleDecision = async (override: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        sessionId: session.id,
        confirmedEsi: override ? selectedOverrideEsi : currentEsi,
        isOverride: override,
        overrideReason: override ? overrideReason : undefined,
        reviewNotes: reviewNotes.trim() || undefined,
      };

      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit clinician review");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to complete review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
              ESI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Case Review: {session.patient.name}</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {session.id.slice(-6)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {session.patient.age}yo {session.patient.sex} &bull; Arrival: {session.arrivalMode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI vs Safety Comparison Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI Recommendation */}
            <div className={`p-4 rounded-xl border ${currentBadge.bg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                  AI Recommendation
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentBadge.badge}`}>
                  ESI {currentEsi}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-950">{session.assessment?.acuityLabel}</h3>
              <p className="text-xs font-semibold text-slate-700">
                Confidence: {Math.round((session.assessment?.confidenceScore || 0.9) * 100)}%
              </p>
              <p className="text-xs text-slate-600">
                Routing: <strong>{session.assessment?.recommendedRouting}</strong>
              </p>
            </div>

            {/* Deterministic Safety Trigger Status */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Deterministic Safety Rules
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  session.redFlags.length > 0 ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                }`}>
                  {session.redFlags.length > 0 ? `${session.redFlags.length} Red Flags` : "Passed"}
                </span>
              </div>
              {session.redFlags.length > 0 ? (
                <ul className="space-y-1 text-xs text-red-800">
                  {session.redFlags.map((rf, i) => (
                    <li key={i} className="font-medium">? {rf.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> No immediate emergency red-flag triggers fired.
                </p>
              )}
            </div>
          </div>

          {/* Chief Complaint & Nurse Notes */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chief Complaint & Vitals</h4>
            <p className="text-sm font-semibold text-slate-900">&ldquo;{session.chiefComplaint}&rdquo;</p>
            {session.nurseObs && (
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800">Nurse Notes:</strong> {session.nurseObs}
              </p>
            )}

            {/* Vitals Grid */}
            {session.vitals && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-200/80">
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">HR</span>
                  <span className="text-xs font-bold text-slate-900">{session.vitals.heartRate ?? "--"} bpm</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">BP</span>
                  <span className="text-xs font-bold text-slate-900">
                    {session.vitals.systolicBp && session.vitals.diastolicBp ? `${session.vitals.systolicBp}/${session.vitals.diastolicBp}` : "--"}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">SpO2</span>
                  <span className="text-xs font-bold text-slate-900">{session.vitals.oxygenSaturation ?? "--"}%</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">RR</span>
                  <span className="text-xs font-bold text-slate-900">{session.vitals.respiratoryRate ?? "--"}/m</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Temp</span>
                  <span className="text-xs font-bold text-slate-900">{session.vitals.temperatureCelsius ?? "--"}?C</span>
                </div>
                <div className="bg-white p-2 rounded-lg text-center border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Pain</span>
                  <span className="text-xs font-bold text-red-600">{session.vitals.painScore ?? 0}/10</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Clinical Drivers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Clinical Rationale & Primary Drivers</h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs text-slate-700 italic">{session.assessment?.clinicalRationale}</p>
              <div className="space-y-1 pt-2 border-t border-slate-200">
                {(session.assessment?.primaryDrivers || []).map((driver, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span>{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Human Clinician Action Section */}
          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Clinician Review & Confirmation</span>
              </h4>

              <button
                onClick={() => setIsOverrideMode(!isOverrideMode)}
                type="button"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isOverrideMode ? "Cancel Override" : "Override AI Level"}</span>
              </button>
            </div>

            {isOverrideMode ? (
              <div className="space-y-4 pt-2 border-t border-blue-200 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Overridden ESI Level *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const b = getEsiBadge(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSelectedOverrideEsi(lvl)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            selectedOverrideEsi === lvl
                              ? `${b.badge} shadow-md scale-105`
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          ESI {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mandatory Override Rationale *
                  </label>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {OVERRIDE_REASONS.map((r, i) => (
                      <option key={i} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Clinician Review Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add clinical observations or treatment room assignments..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {isOverrideMode ? (
            <button
              onClick={() => handleDecision(true)}
              disabled={loading}
              type="button"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
              <span>Confirm Override to ESI {selectedOverrideEsi}</span>
            </button>
          ) : (
            <button
              onClick={() => handleDecision(false)}
              disabled={loading}
              type="button"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              <span>1-Click Accept AI Recommendation (ESI {currentEsi})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
