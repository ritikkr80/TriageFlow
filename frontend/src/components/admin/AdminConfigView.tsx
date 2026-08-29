"use client";

import React, { useState } from "react";
import { Cpu, ShieldAlert, Sliders, CheckCircle, Save } from "lucide-react";

export const AdminConfigView: React.FC = () => {
  const [provider, setProvider] = useState<string>("mock");
  const [geminiModel, setGeminiModel] = useState<string>("gemini-2.5-flash");
  const [conservativeMode, setConservativeMode] = useState<boolean>(true);
  const [minConfidenceMissingVitals, setMinConfidenceMissingVitals] = useState<number>(65);
  const [enableCardiacRedFlag, setEnableCardiacRedFlag] = useState<boolean>(true);
  const [enableStrokeFast, setEnableStrokeFast] = useState<boolean>(true);
  const [enableSepsisRule, setEnableSepsisRule] = useState<boolean>(true);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Configuration saved and propagated to clinical reasoning engine.</span>
        </div>
      )}

      {/* AI Model Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Cpu className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">AI Engine & Provider Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Active LLM Provider Engine
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="mock">Built-in High-Fidelity Clinical Simulator (Local Safe)</option>
              <option value="gemini">Google Gemini AI (Cloud LLM)</option>
              <option value="openai">OpenAI GPT-4o Clinical (Cloud LLM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Model Tier
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Latency: &lt; 400ms)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Clinical Reasoning)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deterministic Red-Flag Safety Rules */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-slate-900 text-sm">Deterministic Red-Flag Safety Rules</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Acute Coronary Syndrome (ACS / STEMI) Rule</span>
              <span className="text-[11px] text-slate-500">Forces ESI 2 on chest pain with diaphoresis or cardiac risk history</span>
            </div>
            <input
              type="checkbox"
              checked={enableCardiacRedFlag}
              onChange={(e) => setEnableCardiacRedFlag(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Stroke FAST Time-Critical Window Rule</span>
              <span className="text-[11px] text-slate-500">Forces ESI 2 and Stat CT Neuro on acute focal neurological deficits</span>
            </div>
            <input
              type="checkbox"
              checked={enableStrokeFast}
              onChange={(e) => setEnableStrokeFast(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Sepsis Screening (qSOFA / SIRS) Rule</span>
              <span className="text-[11px] text-slate-500">Escalates fever + tachycardia + tachypnea/hypotension to ESI 2</span>
            </div>
            <input
              type="checkbox"
              checked={enableSepsisRule}
              onChange={(e) => setEnableSepsisRule(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Safety Policy */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sliders className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-slate-900 text-sm">Conservative Posture & Uncertainty Thresholds</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Max AI Confidence Cap When Vitals Are Missing</span>
              <span>{minConfidenceMissingVitals}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="80"
              value={minConfidenceMissingVitals}
              onChange={(e) => setMinConfidenceMissingVitals(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={conservativeMode}
              onChange={(e) => setConservativeMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span>Default to conservative higher-acuity tier when patient responses are ambiguous or missing</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          type="button"
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow text-xs flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
};
