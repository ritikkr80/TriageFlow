const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TriageFlow clinical database...");

  // Clean existing
  await prisma.auditLog.deleteMany();
  await prisma.clinicianReview.deleteMany();
  await prisma.redFlagRecord.deleteMany();
  await prisma.triageAssessment.deleteMany();
  await prisma.vitalsRecord.deleteMany();
  await prisma.triageSession.deleteMany();
  await prisma.clinician.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users & Clinicians
  const nurseUser = await prisma.user.create({
    data: {
      email: "sarah.jenkins@hospital.org",
      name: "Sarah Jenkins, RN",
      role: "NURSE",
      clinician: {
        create: {
          staffBadge: "RN-8842",
          department: "Emergency Department",
          station: "Rapid Triage Desk 1",
        },
      },
    },
    include: { clinician: true },
  });

  const docUser = await prisma.user.create({
    data: {
      email: "dr.vance@hospital.org",
      name: "Dr. Marcus Vance, MD",
      role: "PHYSICIAN",
      clinician: {
        create: {
          staffBadge: "MD-1029",
          department: "Emergency Medicine",
          station: "Attending Physician Station",
        },
      },
    },
    include: { clinician: true },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@triageflow.health",
      name: "System Administrator",
      role: "ADMIN",
    },
  });

  // 2. Case 1: Possible Acute Coronary Syndrome (ESI 2)
  const p1 = await prisma.patient.create({
    data: {
      name: "Robert Henderson",
      age: 58,
      sex: "MALE",
      allergies: JSON.stringify(["Penicillin"]),
      medicalHistory: JSON.stringify(["Hypertension", "Hyperlipidemia", "Type 2 Diabetes"]),
      currentMeds: JSON.stringify(["Metformin 500mg", "Lisinopril 10mg"]),
    },
  });

  const s1 = await prisma.triageSession.create({
    data: {
      patientId: p1.id,
      arrivalMode: "WALK_IN",
      chiefComplaint: "Crushing chest pain radiating down left arm with sudden cold sweats",
      symptoms: JSON.stringify(["Chest pain", "Diaphoresis", "Left arm radiation", "Nausea"]),
      durationHours: 1.5,
      nurseObs: "Patient is visibly diaphoretic, clutching chest, pale.",
      status: "PENDING_REVIEW",
      createdAt: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
      vitals: {
        create: {
          heartRate: 104,
          systolicBp: 168,
          diastolicBp: 98,
          oxygenSat: 94,
          respRate: 22,
          temperature: 37.1,
          painScore: 9,
        },
      },
      assessment: {
        create: {
          esiLevel: 2,
          acuityLabel: "Emergent (ESI 2)",
          confidenceScore: 0.98,
          primaryDrivers: JSON.stringify([
            "DETERMINISTIC SAFETY OVERRIDE: Escalated to ESI 2 due to critical red-flag triggers.",
            "Substernal chest pressure with cardiac risk profile",
            "Visible diaphoresis and hypertension",
          ]),
          recommendedRouting: "Acute Cardiac Bay - Stat 12-Lead ECG & Troponin",
          reassessIntervalMinutes: 15,
          clinicianReviewRequired: true,
          requiresResuscitation: false,
          missingCriticalData: JSON.stringify([]),
          patientExplanation: "You have been categorized as Emergent (ESI 2). You will be moved to a monitored cardiac bay immediately for an electrocardiogram.",
          clinicalRationale: "High probability ACS presentation meeting deterministic safety rule criteria.",
          safetyDisclaimer: "TRIAGEFLOW SAFETY NOTICE: Decision-support recommendation. Clinical confirmation required.",
          aiProvider: "Clinical-AI-Safety-Engine",
        },
      },
      redFlags: {
        create: [
          {
            code: "RF_POSSIBLE_ACS",
            category: "Cardiology",
            severity: "CRITICAL",
            description: "Potential Acute Coronary Syndrome (ACS) / Myocardial Infarction",
            triggeredBy: "Chest pain with associated cardiac risk profile / diaphoresis",
            deterministic: true,
          },
          {
            code: "RF_SEVERE_INTRACTABLE_PAIN",
            category: "Pain Management",
            severity: "MODERATE",
            description: "Severe intractable acute pain (Score 9/10)",
            triggeredBy: "Pain score: 9/10",
            deterministic: true,
          },
        ],
      },
    },
  });

  // 3. Case 2: Acute Stroke FAST (ESI 2)
  const p2 = await prisma.patient.create({
    data: {
      name: "Eleanor Wright",
      age: 71,
      sex: "FEMALE",
      allergies: JSON.stringify(["Sulfa drugs"]),
      medicalHistory: JSON.stringify(["Atrial Fibrillation", "Prior TIA"]),
      currentMeds: JSON.stringify(["Warfarin 5mg"]),
    },
  });

  await prisma.triageSession.create({
    data: {
      patientId: p2.id,
      arrivalMode: "AMBULANCE",
      chiefComplaint: "Acute slurred speech and sudden right arm weakness started 45 minutes ago",
      symptoms: JSON.stringify(["Slurred speech", "Right arm weakness", "Facial droop"]),
      durationHours: 0.75,
      nurseObs: "Pronator drift present on right arm, mild expressive aphasia.",
      status: "PENDING_REVIEW",
      createdAt: new Date(Date.now() - 1000 * 60 * 6), // 6 mins ago
      vitals: {
        create: {
          heartRate: 88,
          systolicBp: 178,
          diastolicBp: 96,
          oxygenSat: 97,
          respRate: 18,
          temperature: 36.8,
          painScore: 2,
        },
      },
      assessment: {
        create: {
          esiLevel: 2,
          acuityLabel: "Emergent (ESI 2)",
          confidenceScore: 0.99,
          primaryDrivers: JSON.stringify([
            "DETERMINISTIC SAFETY OVERRIDE: Escalated to ESI 2 due to critical red-flag triggers.",
            "Acute focal neurological deficit within thrombolysis window (< 4.5h)",
            "FAST protocol positive",
          ]),
          recommendedRouting: "Stat CT Neuro / Stroke Team Alert",
          reassessIntervalMinutes: 15,
          clinicianReviewRequired: true,
          requiresResuscitation: false,
          missingCriticalData: JSON.stringify([]),
          patientExplanation: "You are prioritized as Emergent (ESI 2). The stroke team and CT scanner are being notified for immediate brain imaging.",
          clinicalRationale: "Acute focal neurological deficit with symptom onset < 4.5h qualifies for time-critical stroke protocol.",
          safetyDisclaimer: "TRIAGEFLOW SAFETY NOTICE: Decision-support recommendation. Clinical confirmation required.",
          aiProvider: "Clinical-AI-Safety-Engine",
        },
      },
      redFlags: {
        create: [
          {
            code: "RF_ACUTE_STROKE_FAST",
            category: "Neurological",
            severity: "CRITICAL",
            description: "Suspected Acute Ischemic / Hemorrhagic Stroke (FAST Protocol alert)",
            triggeredBy: "Focal neurological deficit",
            deterministic: true,
          },
        ],
      },
    },
  });

  // 4. Case 3: Acute Abdominal Pain (ESI 3) - Reviewed & Confirmed
  const p3 = await prisma.patient.create({
    data: {
      name: "David Kim",
      age: 29,
      sex: "MALE",
      allergies: JSON.stringify([]),
      medicalHistory: JSON.stringify([]),
      currentMeds: JSON.stringify([]),
    },
  });

  const s3 = await prisma.triageSession.create({
    data: {
      patientId: p3.id,
      arrivalMode: "WALK_IN",
      chiefComplaint: "Constant right lower quadrant abdominal pain with nausea for 12 hours",
      symptoms: JSON.stringify(["Right lower quadrant pain", "Nausea", "Low grade fever", "Anorexia"]),
      durationHours: 12.0,
      status: "TRIAGED",
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
      vitals: {
        create: {
          heartRate: 84,
          systolicBp: 124,
          diastolicBp: 78,
          oxygenSat: 99,
          respRate: 16,
          temperature: 37.8,
          painScore: 6,
        },
      },
      assessment: {
        create: {
          esiLevel: 3,
          acuityLabel: "Urgent (ESI 3)",
          confidenceScore: 0.94,
          primaryDrivers: JSON.stringify([
            "Multiple diagnostic resources needed (CBC, Urinalysis, Abdominal Ultrasound/CT)",
            "Suspected acute appendicitis presentation",
            "Hemodynamically stable vitals",
          ]),
          recommendedRouting: "General ED Rapid Assessment Area",
          reassessIntervalMinutes: 60,
          clinicianReviewRequired: true,
          requiresResuscitation: false,
          missingCriticalData: JSON.stringify([]),
          patientExplanation: "You have been prioritized as Urgent (ESI 3). You will be assigned a bed for laboratory tests and ultrasound imaging.",
          clinicalRationale: "Expected >= 2 diagnostic and therapeutic resources required with stable vital parameters.",
          safetyDisclaimer: "TRIAGEFLOW SAFETY NOTICE: Automated decision support.",
          aiProvider: "Clinical-AI-Safety-Engine",
        },
      },
      reviews: {
        create: {
          clinicianId: nurseUser.clinician.id,
          confirmedEsi: 3,
          isOverride: false,
          reviewNotes: "Agreed with AI ESI 3. Labs ordered, waiting for bedside ultrasound.",
          reviewedAt: new Date(Date.now() - 1000 * 60 * 20),
        },
      },
    },
  });

  // 5. Case 4: Twisted Ankle (ESI 4)
  const p4 = await prisma.patient.create({
    data: {
      name: "Jessica Taylor",
      age: 22,
      sex: "FEMALE",
      allergies: JSON.stringify([]),
      medicalHistory: JSON.stringify([]),
      currentMeds: JSON.stringify([]),
    },
  });

  await prisma.triageSession.create({
    data: {
      patientId: p4.id,
      arrivalMode: "WALK_IN",
      chiefComplaint: "Inverted right ankle during jogging, mild swelling, can bear partial weight",
      symptoms: JSON.stringify(["Ankle pain", "Mild swelling"]),
      durationHours: 2.0,
      status: "PENDING_REVIEW",
      createdAt: new Date(Date.now() - 1000 * 60 * 45),
      vitals: {
        create: {
          heartRate: 70,
          systolicBp: 116,
          diastolicBp: 74,
          oxygenSat: 100,
          respRate: 14,
          temperature: 36.6,
          painScore: 4,
        },
      },
      assessment: {
        create: {
          esiLevel: 4,
          acuityLabel: "Less Urgent (ESI 4)",
          confidenceScore: 0.95,
          primaryDrivers: JSON.stringify([
            "Single diagnostic resource required (Ankle X-Ray)",
            "Normal stable vital signs",
            "Able to partially ambulate",
          ]),
          recommendedRouting: "Fast Track / Minor Injury Unit",
          reassessIntervalMinutes: 120,
          clinicianReviewRequired: true,
          requiresResuscitation: false,
          missingCriticalData: JSON.stringify([]),
          patientExplanation: "You are categorized as Less Urgent (ESI 4). You will be evaluated in our Fast Track unit for an ankle radiograph.",
          clinicalRationale: "Isolated extremity trauma requiring 1 resource.",
          safetyDisclaimer: "TRIAGEFLOW SAFETY NOTICE: Automated decision support.",
          aiProvider: "Clinical-AI-Safety-Engine",
        },
      },
    },
  });

  // 6. Case 5: Routine Prescription Refill (ESI 5)
  const p5 = await prisma.patient.create({
    data: {
      name: "Samuel Brooks",
      age: 64,
      sex: "MALE",
      allergies: JSON.stringify([]),
      medicalHistory: JSON.stringify(["Hypertension"]),
      currentMeds: JSON.stringify(["Amlodipine 5mg"]),
    },
  });

  await prisma.triageSession.create({
    data: {
      patientId: p5.id,
      arrivalMode: "WALK_IN",
      chiefComplaint: "Ran out of blood pressure medication while traveling, requests temporary refill",
      symptoms: JSON.stringify(["No acute distress"]),
      durationHours: 24.0,
      status: "PENDING_REVIEW",
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
      vitals: {
        create: {
          heartRate: 76,
          systolicBp: 132,
          diastolicBp: 82,
          oxygenSat: 99,
          respRate: 14,
          temperature: 36.7,
          painScore: 0,
        },
      },
      assessment: {
        create: {
          esiLevel: 5,
          acuityLabel: "Non-Urgent (ESI 5)",
          confidenceScore: 0.98,
          primaryDrivers: JSON.stringify([
            "Zero hospital diagnostic/procedural resources required",
            "Prescription renewal request only",
            "Completely stable hemodynamics",
          ]),
          recommendedRouting: "Fast Track / Ambulatory Clinic",
          reassessIntervalMinutes: 240,
          clinicianReviewRequired: true,
          requiresResuscitation: false,
          missingCriticalData: JSON.stringify([]),
          patientExplanation: "You are categorized as Non-Urgent (ESI 5). A clinician will review your prescription renewal.",
          clinicalRationale: "No resource utilization anticipated.",
          safetyDisclaimer: "TRIAGEFLOW SAFETY NOTICE: Automated decision support.",
          aiProvider: "Clinical-AI-Safety-Engine",
        },
      },
    },
  });

  // 7. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        action: "TRIAGE_INTAKE_CREATED",
        actorRole: "SYSTEM",
        entityType: "TriageSession",
        entityId: s1.id,
        details: JSON.stringify({ patient: "Robert Henderson", chiefComplaint: "Crushing chest pain", esiAssigned: 2 }),
      },
      {
        action: "DETERMINISTIC_RED_FLAG_TRIGGERED",
        actorRole: "SYSTEM",
        entityType: "RedFlagRecord",
        entityId: s1.id,
        details: JSON.stringify({ code: "RF_POSSIBLE_ACS", trigger: "Chest pain with cardiac risk profile" }),
      },
      {
        action: "CLINICIAN_CONFIRMATION",
        actorRole: "NURSE",
        actorId: nurseUser.id,
        entityType: "ClinicianReview",
        entityId: s3.id,
        details: JSON.stringify({ patient: "David Kim", confirmedEsi: 3, notes: "Agreed with AI ESI 3" }),
      },
    ],
  });

  console.log("Database successfully seeded with realistic ED triage records!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
