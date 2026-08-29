import { TriageInputPayload, TriageAssessmentResult } from "@/types/triage";
import { evaluateDeterministicRules } from "./deterministic-rules";

const FASTAPI_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || "http://127.0.0.1:8000/api/v1";

export async function requestAITriageEvaluation(payload: TriageInputPayload): Promise<TriageAssessmentResult> {
  const safetyCheck = evaluateDeterministicRules(payload);

  // Format payload for FastAPI microservice
  const pythonPayload = {
    demographics: {
      age: payload.demographics.age,
      sex: payload.demographics.sex,
      is_pregnant: payload.demographics.isPregnant || false,
      allergies: payload.demographics.allergies || [],
      medical_history: payload.demographics.medicalHistory || [],
      current_medications: payload.demographics.currentMedications || [],
    },
    arrival_mode: payload.arrivalMode,
    chief_complaint: payload.chiefComplaint,
    symptoms: payload.symptoms,
    symptom_duration_hours: payload.symptomDurationHours,
    vitals: payload.vitals
      ? {
          heart_rate: payload.vitals.heartRate,
          systolic_bp: payload.vitals.systolicBp,
          diastolic_bp: payload.vitals.diastolicBp,
          oxygen_saturation: payload.vitals.oxygenSaturation,
          respiratory_rate: payload.vitals.respiratoryRate,
          temperature_celsius: payload.vitals.temperatureCelsius,
          pain_score: payload.vitals.painScore,
        }
      : null,
    nurse_observations: payload.nurseObservations,
    gcs_score: payload.gcsScore,
  };

  try {
    const res = await fetch(`${FASTAPI_URL}/triage/evaluate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pythonPayload),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return {
        esiLevel: data.esi_level,
        acuityLabel: data.acuity_label,
        confidenceScore: data.confidence_score,
        primaryDrivers: data.primary_drivers,
        detectedRedFlags: (data.detected_red_flags || []).map((f: any) => ({
          code: f.code,
          category: f.category,
          severity: f.severity,
          description: f.description,
          triggeredBy: f.triggered_by,
          deterministic: f.deterministic ?? true,
        })),
        recommendedRouting: data.recommended_routing,
        reassessmentIntervalMinutes: data.reassessment_interval_minutes,
        clinicianReviewRequired: data.clinician_review_required,
        requiresImmediateResuscitation: data.requires_immediate_resuscitation,
        missingCriticalData: data.missing_critical_data || [],
        patientExplanation: data.patient_explanation,
        clinicalRationale: data.clinical_rationale,
        safetyDisclaimer: data.safety_disclaimer,
        aiProvider: data.ai_provider,
        evaluatedAt: data.evaluated_at || new Date().toISOString(),
      };
    }
  } catch (error) {
    console.warn("FastAPI microservice call failed, utilizing safe in-process fallback engine:", error);
  }

  // Resilient fallback engine: deterministic safety rules + ESI algorithm
  const text = `${payload.chiefComplaint} ${payload.symptoms.join(" ")}`.toLowerCase();
  let esi: 1 | 2 | 3 | 4 | 5 = 3;
  let routing = "ED General Intake Area";
  let acuity = "Urgent (ESI 3)";
  const drivers: string[] = [];

  if (text.includes("chest") || text.includes("heart") || text.includes("breath") || text.includes("stroke")) {
    esi = 2;
    acuity = "Emergent (ESI 2)";
    routing = "Acute Cardiac / Monitored Bed";
    drivers.push("High-risk cardiorespiratory or neuro symptoms");
  } else if (text.includes("refill") || text.includes("stitch") || text.includes("suture")) {
    esi = 5;
    acuity = "Non-Urgent (ESI 5)";
    routing = "Fast Track / Outpatient Area";
    drivers.push("Zero hospital resources anticipated");
  } else if (text.includes("sprain") || text.includes("cut") || text.includes("rash")) {
    esi = 4;
    acuity = "Less Urgent (ESI 4)";
    routing = "Fast Track / Minor Injury Unit";
    drivers.push("Single diagnostic resource anticipated");
  } else {
    esi = 3;
    acuity = "Urgent (ESI 3)";
    routing = "General ED Rapid Assessment Area";
    drivers.push(`Standard clinical intake for: ${payload.chiefComplaint}`);
  }

  // Apply deterministic override
  if (safetyCheck.hasCriticalRedFlag && safetyCheck.overrideEsi) {
    if (safetyCheck.overrideEsi < esi) {
      esi = safetyCheck.overrideEsi;
      drivers.unshift(`DETERMINISTIC SAFETY OVERRIDE: Escalated to ESI ${esi}`);
      if (safetyCheck.recommendedRouting) routing = safetyCheck.recommendedRouting;
    }
  }

  return {
    esiLevel: esi,
    acuityLabel: acuity,
    confidenceScore: payload.vitals ? 0.92 : 0.65,
    primaryDrivers: drivers,
    detectedRedFlags: safetyCheck.flags,
    recommendedRouting: routing,
    reassessmentIntervalMinutes: esi === 1 ? 0 : esi === 2 ? 15 : esi === 3 ? 60 : 120,
    clinicianReviewRequired: true,
    requiresImmediateResuscitation: esi === 1,
    missingCriticalData: payload.vitals ? [] : ["Baseline vitals"],
    patientExplanation: `You have been categorized as ${acuity}. Our emergency department clinical staff will assess you based on this prioritization.`,
    clinicalRationale: `Assigned ESI ${esi} based on deterministic clinical algorithm rules and resource assessment.`,
    safetyDisclaimer:
      "TRIAGEFLOW SAFETY NOTICE: This assessment is an automated clinical decision-support recommendation and does NOT constitute a medical diagnosis. A licensed clinician must confirm all triage levels. Alert staff immediately if condition worsens.",
    aiProvider: "Deterministic-Resilient-Engine (Local)",
    evaluatedAt: new Date().toISOString(),
  };
}
