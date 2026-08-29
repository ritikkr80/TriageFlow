import { TriageInputPayload, RedFlag, EsiLevel } from "@/types/triage";

export interface RedFlagCheckResult {
  hasCriticalRedFlag: boolean;
  overrideEsi?: EsiLevel;
  flags: RedFlag[];
  recommendedRouting?: string;
}

export function evaluateDeterministicRules(data: TriageInputPayload): RedFlagCheckResult {
  const flags: RedFlag[] = [];
  let overrideEsi: EsiLevel | undefined = undefined;
  let routing: string | undefined = undefined;

  const complaint = (data.chiefComplaint || "").toLowerCase();
  const symptoms = (data.symptoms || []).map((s) => s.toLowerCase());
  const obs = (data.nurseObservations || "").toLowerCase();
  const combined = `${complaint} ${symptoms.join(" ")} ${obs}`;
  const v = data.vitals;

  // 1. ESI 1: RESUSCITATION RULES
  if (data.gcsScore !== undefined && data.gcsScore !== null && data.gcsScore < 9) {
    flags.push({
      code: "RF_GCS_CRITICAL",
      category: "Neurological",
      severity: "CRITICAL",
      description: "Severe altered level of consciousness (GCS < 9)",
      triggeredBy: `GCS score: ${data.gcsScore}`,
      deterministic: true,
    });
    overrideEsi = 1;
    routing = "Resuscitation Bay (Trauma / Shock Room)";
  }

  if (v?.oxygenSaturation !== undefined && v?.oxygenSaturation !== null && v.oxygenSaturation < 85) {
    flags.push({
      code: "RF_SEVERE_HYPOXIA",
      category: "Respiratory",
      severity: "CRITICAL",
      description: "Critical hypoxia (SpO2 < 85%)",
      triggeredBy: `SpO2: ${v.oxygenSaturation}%`,
      deterministic: true,
    });
    overrideEsi = 1;
    routing = "Resuscitation Bay - Immediate High-Flow O2 / Intubation Prep";
  }

  if (v?.systolicBp !== undefined && v?.systolicBp !== null && v.systolicBp < 80) {
    flags.push({
      code: "RF_SEVERE_HYPOTENSION_SHOCK",
      category: "Cardiovascular / Shock",
      severity: "CRITICAL",
      description: "Severe hypotension / decompensated shock (SBP < 80 mmHg)",
      triggeredBy: `Systolic BP: ${v.systolicBp} mmHg`,
      deterministic: true,
    });
    overrideEsi = 1;
    routing = "Resuscitation Bay - Immediate IV Access / Shock Protocol";
  }

  if (
    ["unresponsive", "not breathing", "pulseless", "cardiac arrest", "respiratory arrest"].some((k) =>
      combined.includes(k)
    )
  ) {
    flags.push({
      code: "RF_CARDIOPULMONARY_ARREST",
      category: "Resuscitation",
      severity: "CRITICAL",
      description: "Unresponsive or acute cardiopulmonary arrest pattern",
      triggeredBy: "Observations / Chief Complaint indicator",
      deterministic: true,
    });
    overrideEsi = 1;
    routing = "Resuscitation Bay (Code Blue / Immediate Life Support)";
  }

  // 2. ESI 2: EMERGENT RULES
  const isCardiac = ["chest pain", "chest tightness", "pressure in chest", "angina", "left arm pain", "substernal", "diaphoretic"].some(
    (k) => combined.includes(k)
  );
  const hasCardiacRisk =
    data.demographics.age >= 35 ||
    (data.demographics.medicalHistory || []).some(
      (m) => m.toLowerCase().includes("cardiac") || m.toLowerCase().includes("hypertension") || m.toLowerCase().includes("diabetes")
    ) ||
    combined.includes("diaphoretic") ||
    combined.includes("sweating") ||
    combined.includes("shortness of breath");

  if (isCardiac && hasCardiacRisk) {
    flags.push({
      code: "RF_POSSIBLE_ACS",
      category: "Cardiology",
      severity: "CRITICAL",
      description: "Potential Acute Coronary Syndrome (ACS) / Myocardial Infarction",
      triggeredBy: "Chest pain with associated cardiac risk profile / diaphoresis",
      deterministic: true,
    });
    if (overrideEsi !== 1) {
      overrideEsi = 2;
      routing = "Acute Cardiac Bay - Stat 12-Lead ECG & Troponin";
    }
  }

  const strokeKeywords = ["facial droop", "slurred speech", "one-sided weakness", "hemiparesis", "aphasia", "stroke", "sudden numbness", "loss of speech"];
  if (strokeKeywords.some((k) => combined.includes(k))) {
    const durationNote = data.symptomDurationHours !== undefined ? ` (Duration: ${data.symptomDurationHours}h)` : "";
    flags.push({
      code: "RF_ACUTE_STROKE_FAST",
      category: "Neurological",
      severity: "CRITICAL",
      description: `Suspected Acute Ischemic / Hemorrhagic Stroke (FAST Protocol)${durationNote}`,
      triggeredBy: "Focal neurological deficits / acute speech or motor loss",
      deterministic: true,
    });
    if (overrideEsi !== 1) {
      overrideEsi = 2;
      routing = "Stat CT Neuro / Stroke Team Alert";
    }
  }

  // Sepsis Screening (SIRS / qSOFA)
  let sepsisCount = 0;
  const sepsisTriggers: string[] = [];
  if (v) {
    if (v.temperatureCelsius && (v.temperatureCelsius >= 38.3 || v.temperatureCelsius < 36.0)) {
      sepsisCount++;
      sepsisTriggers.push(`Temp ${v.temperatureCelsius}C`);
    }
    if (v.heartRate && v.heartRate > 95) {
      sepsisCount++;
      sepsisTriggers.push(`HR ${v.heartRate} bpm`);
    }
    if (v.respiratoryRate && v.respiratoryRate >= 22) {
      sepsisCount++;
      sepsisTriggers.push(`RR ${v.respiratoryRate}/min`);
    }
    if (v.systolicBp && v.systolicBp <= 100) {
      sepsisCount++;
      sepsisTriggers.push(`SBP ${v.systolicBp} mmHg`);
    }
  }
  const isInfection = ["fever", "chills", "cough", "dysuria", "cellulitis", "wound infection", "lethargic", "confused"].some(
    (k) => combined.includes(k)
  );
  if (sepsisCount >= 2 && isInfection) {
    flags.push({
      code: "RF_SEPSIS_WARNING",
      category: "Infectious / Sepsis",
      severity: "HIGH",
      description: "Potential Severe Sepsis / Septic Shock Criteria (SIRS/qSOFA positive)",
      triggeredBy: sepsisTriggers.join(", "),
      deterministic: true,
    });
    if (overrideEsi !== 1 && overrideEsi !== 2) {
      overrideEsi = 2;
      routing = "Rapid Assessment - Sepsis Protocol (Blood cultures + IV Lactate/Fluids)";
    }
  }

  // Anaphylaxis
  const anaphylaxisKeywords = ["throat closing", "tongue swelling", "stridor", "wheezing", "peanut allergy", "bee sting", "anaphylaxis", "lip swelling"];
  if (anaphylaxisKeywords.some((k) => combined.includes(k))) {
    flags.push({
      code: "RF_ANAPHYLAXIS_AIRWAY",
      category: "Immunology / Airway",
      severity: "CRITICAL",
      description: "High risk for severe Anaphylaxis or imminent Airway Compromise",
      triggeredBy: "Upper airway swelling / allergen exposure pattern",
      deterministic: true,
    });
    if (overrideEsi !== 1) {
      overrideEsi = 2;
      routing = "Resuscitation / Airway Bay - Immediate IM Epinephrine Prep";
    }
  }

  // Severe Respiratory Distress
  if (v && ((v.oxygenSaturation && v.oxygenSaturation >= 85 && v.oxygenSaturation < 90) || (v.respiratoryRate && v.respiratoryRate >= 30))) {
    flags.push({
      code: "RF_ACUTE_RESPIRATORY_DISTRESS",
      category: "Respiratory",
      severity: "HIGH",
      description: "Severe acute respiratory distress / hypoxia",
      triggeredBy: `SpO2: ${v.oxygenSaturation}%, RR: ${v.respiratoryRate}`,
      deterministic: true,
    });
    if (overrideEsi !== 1 && overrideEsi !== 2) {
      overrideEsi = 2;
      routing = "Acute Respiratory Bed - Supplemental O2 / Nebulizer";
    }
  }

  // Pediatric high fever in neonate/infant (< 3 months)
  if (data.demographics.age === 0 && v?.temperatureCelsius && v.temperatureCelsius >= 38.0) {
    flags.push({
      code: "RF_PEDIATRIC_NEONATAL_FEVER",
      category: "Pediatrics",
      severity: "HIGH",
      description: "Neonatal / Infant Fever (< 3 months of age, temp >= 38.0C)",
      triggeredBy: `Age: infant, Temp: ${v.temperatureCelsius}C`,
      deterministic: true,
    });
    if (overrideEsi !== 1 && overrideEsi !== 2) {
      overrideEsi = 2;
      routing = "Pediatric Emergency Zone - Stat Full Sepsis Workup";
    }
  }

  // Severe Pain Score 9-10
  if (v?.painScore && v.painScore >= 9) {
    flags.push({
      code: "RF_SEVERE_INTRACTABLE_PAIN",
      category: "Pain Management",
      severity: "MODERATE",
      description: "Severe intractable acute pain (Score >= 9/10)",
      triggeredBy: `Pain score: ${v.painScore}/10`,
      deterministic: true,
    });
    if (overrideEsi !== 1 && overrideEsi !== 2) {
      overrideEsi = 2;
    }
  }

  const hasCritical = flags.some((f) => f.severity === "CRITICAL" || f.severity === "HIGH");

  return {
    hasCriticalRedFlag: hasCritical,
    overrideEsi,
    flags,
    recommendedRouting: routing,
  };
}
