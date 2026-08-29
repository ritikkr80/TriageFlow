"use client";

import React, { useState } from "react";
import { User, Activity, AlertTriangle, Shield, Check, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { TriageInputPayload, TriageAssessmentResult, RedFlag } from "@/types/triage";
import { evaluateDeterministicRules } from "@/lib/deterministic-rules";
import { RedFlagModal } from "./RedFlagModal";
import { PatientResultView } from "./PatientResultView";

const COMMON_SYMPTOMS = [
  "Chest Pain",
  "Shortness of Breath",
  "Severe Headache",
  "Dizziness / Lightheadedness",
  "Nausea / Vomiting",
  "Abdominal Pain",
  "Fever / Chills",
  "Cough",
  "Slurred Speech",
  "One-Sided Weakness",
  "Throat Swelling",
  "Diaphoresis (Profuse Sweating)",
  "Laceration / Cut",
  "Ankle / Joint Sprain",
  "Prescription Refill Request",
];

const MEDICAL_HISTORY_OPTIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Coronary Artery Disease",
  "Asthma / COPD",
  "Stroke / TIA",
  "Atrial Fibrillation",
  "Chronic Kidney Disease",
  "Cancer",
];

export const TriageWizard: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [sex, setSex] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [arrivalMode, setArrivalMode] = useState<"WALK_IN" | "AMBULANCE" | "WHEELCHAIR" | "OTHER">("WALK_IN");
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [allergiesText, setAllergiesText] = useState<string>("");

  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState<number | "">("");

  // Vitals State
  const [includeVitals, setIncludeVitals] = useState<boolean>(true);
  const [heartRate, setHeartRate] = useState<number | "">("");
  const [systolicBp, setSystolicBp] = useState<number | "">("");
  const [diastolicBp, setDiastolicBp] = useState<number | "">("");
  const [oxygenSaturation, setOxygenSaturation] = useState<number | "">("");
  const [respiratoryRate, setRespiratoryRate] = useState<number | "">("");
  const [temperatureCelsius, setTemperatureCelsius] = useState<number | "">("");
  const [painScore, setPainScore] = useState<number>(0);
  const [nurseObservations, setNurseObservations] = useState<string>("");

  // Interceptor modal state
  const [showRedFlagModal, setShowRedFlagModal] = useState<boolean>(false);
  const [interceptedFlags, setInterceptedFlags] = useState<RedFlag[]>([]);

  // Submission Result State
  const [submittedAssessment, setSubmittedAssessment] = useState<{
    assessment: TriageAssessmentResult;
    sessionId: string;
  } | null>(null);

  // Quick symptom toggle
  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const toggleHistory = (item: string) => {
    setMedicalHistory((prev) =>
      prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item]
    );
  };

  // Build Payload
  const buildPayload = (): TriageInputPayload => {
    const vitalsObj = includeVitals
      ? {
          heartRate: heartRate !== "" ? Number(heartRate) : undefined,
          systolicBp: systolicBp !== "" ? Number(systolicBp) : undefined,
          diastolicBp: diastolicBp !== "" ? Number(diastolicBp) : undefined,
          oxygenSaturation: oxygenSaturation !== "" ? Number(oxygenSaturation) : undefined,
          respiratoryRate: respiratoryRate !== "" ? Number(respiratoryRate) : undefined,
          temperatureCelsius: temperatureCelsius !== "" ? Number(temperatureCelsius) : undefined,
          painScore,
        }
      : undefined;

    return {
      demographics: {
        name: name.trim() || "Anonymous Patient",
        age: age !== "" ? Number(age) : 35,
        sex,
        isPregnant,
        allergies: allergiesText ? allergiesText.split(",").map((s) => s.trim()) : [],
        medicalHistory,
      },
      arrivalMode,
      chiefComplaint: chiefComplaint.trim(),
      symptoms: selectedSymptoms,
      symptomDurationHours: durationHours !== "" ? Number(durationHours) : undefined,
      vitals: vitalsObj,
      nurseObservations: nurseObservations.trim() || undefined,
    };
  };

  // Step validation and Red Flag check before moving to next step
  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter the patient's name.");
        return;
      }
      if (age === "" || Number(age) < 0 || Number(age) > 130) {
        setError("Please enter a valid age.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!chiefComplaint.trim()) {
        setError("Please describe the main reason for your visit (Chief Complaint).");
        return;
      }
      // Check deterministic rules immediately on symptoms
      const currentPayload = buildPayload();
      const check = evaluateDeterministicRules(currentPayload);
      if (check.hasCriticalRedFlag && !showRedFlagModal) {
        setInterceptedFlags(check.flags);
        setShowRedFlagModal(true);
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Check vitals rules
      const currentPayload = buildPayload();
      const check = evaluateDeterministicRules(currentPayload);
      if (check.hasCriticalRedFlag && interceptedFlags.length === 0) {
        setInterceptedFlags(check.flags);
        setShowRedFlagModal(true);
        return;
      }
      setStep(4);
    }
  };

  // Submit to Server API
  const handleSubmitTriage = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit triage evaluation");
      }

      const data = await res.json();
      setSubmittedAssessment({
        assessment: data.assessment,
        sessionId: data.sessionId,
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during triage evaluation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedAssessment(null);
    setStep(1);
    setName("");
    setAge("");
    setChiefComplaint("");
    setSelectedSymptoms([]);
    setMedicalHistory([]);
    setHeartRate("");
    setSystolicBp("");
    setDiastolicBp("");
    setOxygenSaturation("");
    setRespiratoryRate("");
    setTemperatureCelsius("");
    setPainScore(0);
    setNurseObservations("");
    setError(null);
  };

  // If already submitted, display patient result view
  if (submittedAssessment) {
    return (
      <PatientResultView
        assessment={submittedAssessment.assessment}
        patientName={name}
        chiefComplaint={chiefComplaint}
        sessionId={submittedAssessment.sessionId}
        onReset={handleReset}
      />
    );
  }

  const steps = [
    { num: 1, label: "Demographics" },
    { num: 2, label: "Chief Complaint" },
    { num: 3, label: "Vitals & Symptoms" },
    { num: 4, label: "Review & Evaluate" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Red Flag Interceptor Modal */}
      {showRedFlagModal && (
        <RedFlagModal
          flags={interceptedFlags}
          onProceed={() => {
            setShowRedFlagModal(false);
            if (step === 2) setStep(3);
            else if (step === 3) setStep(4);
          }}
          onAlertStaff={() => {
            alert("Emergency Medical Alert triggered. Please speak to the triage nurse immediately.");
          }}
        />
      )}

      {/* Stepper Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Patient Intake & Triage Assessment
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Step-by-step clinical information gathering with real-time safety checks.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            Step {step} of 4
          </span>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => (
            <div key={s.num} className="space-y-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  step >= s.num ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 block truncate">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs sm:text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: DEMOGRAPHICS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>1. Patient Demographics & History</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="e.g. 45"
                  min="0"
                  max="125"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Biological Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Mode of Arrival
                </label>
                <select
                  value={arrivalMode}
                  onChange={(e) => setArrivalMode(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium bg-white"
                >
                  <option value="WALK_IN">Walk-In</option>
                  <option value="AMBULANCE">Ambulance (EMS)</option>
                  <option value="WHEELCHAIR">Wheelchair</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {sex === "FEMALE" && Number(age) >= 12 && Number(age) <= 55 && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="pregnant"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="pregnant" className="text-xs sm:text-sm font-medium text-slate-700">
                  Currently Pregnant or Suspected Pregnancy
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Past Medical History (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_HISTORY_OPTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleHistory(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      medicalHistory.includes(item)
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {medicalHistory.includes(item) && "? "}
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Known Drug Allergies (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Aspirin"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CHIEF COMPLAINT & SYMPTOMS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>2. Chief Complaint & Symptoms</span>
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Main Reason for Visit (Chief Complaint) *
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                rows={3}
                placeholder="Describe your symptoms in your own words (e.g., 'Severe crushing chest pain and left arm numbness that started 1 hour ago while resting')..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                How long have these symptoms been present? (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1.5 hours"
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Quick Symptom Tags (Click all that match)
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  const isRedFlag = [
                    "Chest Pain",
                    "Shortness of Breath",
                    "Slurred Speech",
                    "One-Sided Weakness",
                    "Throat Swelling",
                    "Diaphoresis (Profuse Sweating)",
                  ].includes(sym);

                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? isRedFlag
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{sym}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VITALS & DISTRESS */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>3. Vital Signs & Clinical Distress</span>
              </h2>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVitals}
                  onChange={(e) => setIncludeVitals(e.target.checked)}
                  className="rounded text-blue-600 w-4 h-4"
                />
                <span>Include Vitals</span>
              </label>
            </div>

            {includeVitals ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Heart Rate (BPM)
                    </label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 78"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Systolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={systolicBp}
                      onChange={(e) => setSystolicBp(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 120"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Diastolic BP (mmHg)
                    </label>
                    <input
                      type="number"
                      value={diastolicBp}
                      onChange={(e) => setDiastolicBp(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Oxygen Saturation (SpO2 %)
                    </label>
                    <input
                      type="number"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 98"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Respiratory Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 16"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Body Temp (?C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperatureCelsius}
                      onChange={(e) => setTemperatureCelsius(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g. 37.0"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Pain Score Slider */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="uppercase tracking-wider">Pain Rating (0 - 10 Numeric Scale)</span>
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded font-mono text-sm">
                      {painScore} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={painScore}
                    onChange={(e) => setPainScore(Number(e.target.value))}
                    className="w-full accent-blue-600 h-2 bg-slate-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-1">
                    <span>0: No Pain</span>
                    <span>5: Moderate</span>
                    <span className="text-red-600 font-bold">10: Worst Possible</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nurse / Triage Observations (Optional)
                  </label>
                  <input
                    type="text"
                    value={nurseObservations}
                    onChange={(e) => setNurseObservations(e.target.value)}
                    placeholder="e.g., Pale, sweating, clutching chest, ambulatory without assist..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs sm:text-sm">
                <strong>Conservative Mode Enabled:</strong> Incomplete vital signs will automatically cause the system to moderate AI confidence and lean conservative on acuity assignment.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>4. Review Intake & Run AI Safety Evaluation</span>
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-medium">Patient:</span>{" "}
                  <strong className="text-slate-900">{name} ({age}y, {sex})</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Arrival Mode:</span>{" "}
                  <strong className="text-slate-900">{arrivalMode}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 font-medium">Chief Complaint:</span>{" "}
                  <strong className="text-slate-900">&ldquo;{chiefComplaint}&rdquo;</strong>
                </div>
                {selectedSymptoms.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-medium">Symptoms:</span>{" "}
                    <span className="text-slate-800">{selectedSymptoms.join(", ")}</span>
                  </div>
                )}
                {medicalHistory.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-medium">Medical History:</span>{" "}
                    <span className="text-slate-800">{medicalHistory.join(", ")}</span>
                  </div>
                )}
              </div>

              {/* Red flag indicators */}
              {interceptedFlags.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-900">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Deterministic Red Flag Alert:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {interceptedFlags.map((f, i) => (
                      <li key={i}>{f.description} ({f.triggeredBy})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety notice */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <strong>System Safety Guarantee:</strong> Clicking &ldquo;Evaluate Triage with AI&rdquo; will run both deterministic red-flag safety rules and structured AI reasoning. Results are queued for human clinician validation.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
              type="button"
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNextStep}
              type="button"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-xs sm:text-sm flex items-center gap-1.5 transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmitTriage}
              disabled={loading}
              type="button"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Safety Rules & AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Triage with AI</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
