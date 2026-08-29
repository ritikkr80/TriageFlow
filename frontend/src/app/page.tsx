import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Activity, ShieldCheck, Stethoscope, UserCheck, Settings, ArrowRight, Zap, CheckCircle2, AlertOctagon, HeartPulse, Clock, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Accenture Innovation Challenge 2026 &bull; Team NeutronHunter</span>
        </div>

        {/* Center Logo Display */}
        <div className="flex justify-center my-4">
          <div className="p-4 bg-white/80 backdrop-blur rounded-3xl shadow-lg border border-slate-200/80 inline-block hover:shadow-xl transition-shadow">
            <Image
              src="/logo.png"
              alt="TriageFlow AI - Faster Triage. Better Care."
              width={340}
              height={140}
              priority
              className="h-28 sm:h-36 w-auto object-contain"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-[1.15]">
          AI Reinvention Made Real: <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600">
            Intelligent Emergency Patient Triage
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          One nurse. Seconds per patient. No room for a wrong call. TriageFlow combines <strong>deterministic emergency red-flag safety rules</strong> with <strong>structured clinical AI reasoning</strong> to eliminate under-triage in high-pressure emergency departments.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/patient"
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <UserCheck className="w-4 h-4" />
            <span>Launch Patient Intake</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/clinician"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-lg text-sm flex items-center gap-2 transition-all hover:scale-105"
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>Open Clinician ED Queue</span>
          </Link>

          <Link
            href="/admin"
            className="px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-300 shadow-sm text-sm flex items-center gap-2 transition-all"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Admin & Audit Trail</span>
          </Link>
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">1. Deterministic Safety Supremacy</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Emergency red flags (crushing chest pain with sweating, FAST stroke symptoms, GCS &lt; 9, shock BP &lt; 80) immediately trigger mandatory ESI 1/2 overrides independent of LLM output.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">2. Structured AI Decision Support</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            FastAPI microservice validates every model output against strict Pydantic schemas. Returns transparent ESI 1?5 level, confidence score, primary drivers, and missing data alerts in &lt; 2 seconds.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">3. Human-in-the-Loop & Auditability</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            AI recommends, clinicians decide. 1-click confirmation or structured override with mandatory clinical rationale. Every action is recorded into a normalized, tamper-evident audit trail.
          </p>
        </div>
      </section>

      {/* Emergency Severity Index (ESI 1-5) Explainer Bar */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Standard Emergency Severity Index (ESI 1?5) Hierarchy</h2>
          <p className="text-xs text-slate-500">TriageFlow maps patient presentations to internationally recognized clinical standards:</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1">
            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">ESI 1</span>
            <h4 className="font-bold text-xs">Resuscitation</h4>
            <p className="text-[11px] text-red-800">Immediate life-saving intervention (Arrest, GCS &lt; 9, SpO2 &lt; 85%)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 space-y-1">
            <span className="bg-orange-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">ESI 2</span>
            <h4 className="font-bold text-xs">Emergent</h4>
            <p className="text-[11px] text-orange-800">High risk, severe pain, ACS, stroke FAST, severe sepsis</p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">ESI 3</span>
            <h4 className="font-bold text-xs">Urgent</h4>
            <p className="text-[11px] text-amber-800">Stable vitals, multiple diagnostic/imaging resources needed</p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
            <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">ESI 4</span>
            <h4 className="font-bold text-xs">Less Urgent</h4>
            <p className="text-[11px] text-emerald-800">Single simple resource (Simple X-ray, suture, rapid strep)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
            <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">ESI 5</span>
            <h4 className="font-bold text-xs">Non-Urgent</h4>
            <p className="text-[11px] text-blue-800">Zero hospital resources (Prescription refill, suture removal)</p>
          </div>
        </div>
      </section>
    </div>
  );
}
