"use client";

import React from "react";
import { AlertOctagon, PhoneCall, ArrowRight, ShieldAlert } from "lucide-react";
import { RedFlag } from "@/types/triage";

interface RedFlagModalProps {
  flags: RedFlag[];
  onProceed: () => void;
  onAlertStaff: () => void;
}

export const RedFlagModal: React.FC<RedFlagModalProps> = ({ flags, onProceed, onAlertStaff }) => {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-red-500 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-red-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-red-700/80 border-2 border-red-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
            <AlertOctagon className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">CRITICAL SAFETY ALERT TRIGGERED</h2>
          <p className="text-red-100 text-sm mt-1 font-medium">
            Deterministic emergency red flags detected based on your entered symptoms.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Detected Emergency Criteria:</span>
            </div>
            <ul className="space-y-2">
              {flags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-800 bg-white/80 p-2.5 rounded-lg border border-red-200 shadow-sm">
                  <span className="bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded uppercase mt-0.5">
                    {flag.severity}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">{flag.description}</span>
                    <p className="text-slate-500 text-xs mt-0.5">Trigger: {flag.triggeredBy}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
            <strong>Immediate Clinical Action:</strong> Our triage algorithm has flagged your case for priority evaluation. If you are physically present in the hospital, please approach the triage desk immediately.
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onAlertStaff}
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            Alert Staff / Call 911
          </button>

          <button
            onClick={onProceed}
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Proceed with Full Intake</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
