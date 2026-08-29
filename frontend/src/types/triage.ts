export type Sex = "MALE" | "FEMALE" | "OTHER";
export type ArrivalMode = "WALK_IN" | "AMBULANCE" | "WHEELCHAIR" | "OTHER";
export type EsiLevel = 1 | 2 | 3 | 4 | 5;

export interface VitalsInput {
  heartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  temperatureCelsius?: number;
  painScore?: number;
}

export interface PatientDemographics {
  name: string;
  age: number;
  sex: Sex;
  isPregnant?: boolean;
  allergies?: string[];
  medicalHistory?: string[];
  currentMedications?: string[];
}

export interface TriageInputPayload {
  demographics: PatientDemographics;
  arrivalMode: ArrivalMode;
  chiefComplaint: string;
  symptoms: string[];
  symptomDurationHours?: number;
  vitals?: VitalsInput;
  nurseObservations?: string;
  gcsScore?: number;
}

export interface RedFlag {
  code: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  description: string;
  triggeredBy: string;
  deterministic: boolean;
}

export interface TriageAssessmentResult {
  esiLevel: EsiLevel;
  acuityLabel: string;
  confidenceScore: number;
  primaryDrivers: string[];
  detectedRedFlags: RedFlag[];
  recommendedRouting: string;
  reassessmentIntervalMinutes: number;
  clinicianReviewRequired: boolean;
  requiresImmediateResuscitation: boolean;
  missingCriticalData: string[];
  patientExplanation: string;
  clinicalRationale: string;
  safetyDisclaimer: string;
  aiProvider: string;
  evaluatedAt: string;
}

export interface TriageSessionItem {
  id: string;
  patientId: string;
  patient: {
    name: string;
    age: number;
    sex: string;
    allergies: string[];
    medicalHistory: string[];
    currentMeds: string[];
  };
  arrivalMode: string;
  chiefComplaint: string;
  symptoms: string[];
  durationHours?: number;
  nurseObs?: string;
  gcsScore?: number;
  status: "PENDING_REVIEW" | "TRIAGED" | "OVERRIDDEN" | "DISCHARGED";
  createdAt: string;
  vitals?: VitalsInput;
  assessment?: TriageAssessmentResult;
  redFlags: RedFlag[];
  review?: {
    id: string;
    clinicianName: string;
    confirmedEsi: number;
    isOverride: boolean;
    overrideReason?: string;
    reviewNotes?: string;
    reviewedAt: string;
  };
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorName?: string;
  actorRole: string;
  entityType: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}
