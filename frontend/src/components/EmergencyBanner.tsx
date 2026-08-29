import React from "react";
import { AlertTriangle, PhoneCall } from "lucide-react";

export const EmergencyBanner: React.FC = () => {
  return (
    <div className="bg-red-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-300" />
          <span>
            <strong>EMERGENCY NOTICE:</strong> If you are experiencing life-threatening symptoms (chest crushing pain, severe breathing difficulty, sudden paralysis), alert emergency staff immediately or call <strong>911 / 112</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-red-700/80 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border border-red-500">
            <PhoneCall className="w-3 h-3" /> Dial 911
          </span>
        </div>
      </div>
    </div>
  );
};
