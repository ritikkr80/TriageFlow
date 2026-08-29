import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requestAITriageEvaluation } from "@/lib/ai-client";
import { createAuditLog } from "@/lib/audit";
import { TriageInputPayload } from "@/types/triage";

export async function POST(req: NextRequest) {
  try {
    const body: TriageInputPayload = await req.json();

    if (!body.demographics?.name || body.demographics?.age === undefined || !body.chiefComplaint) {
      return NextResponse.json({ error: "Missing required fields (name, age, chief complaint)" }, { status: 400 });
    }

    // 1. Run AI Evaluation and Deterministic Rules
    const assessment = await requestAITriageEvaluation(body);

    // 2. Create or find patient
    const patient = await prisma.patient.create({
      data: {
        name: body.demographics.name,
        age: body.demographics.age,
        sex: body.demographics.sex,
        isPregnant: body.demographics.isPregnant || false,
        allergies: JSON.stringify(body.demographics.allergies || []),
        medicalHistory: JSON.stringify(body.demographics.medicalHistory || []),
        currentMeds: JSON.stringify(body.demographics.currentMedications || []),
      },
    });

    // 3. Create Triage Session & associated records in a transaction
    const session = await prisma.triageSession.create({
      data: {
        patientId: patient.id,
        arrivalMode: body.arrivalMode || "WALK_IN",
        chiefComplaint: body.chiefComplaint,
        symptoms: JSON.stringify(body.symptoms || []),
        durationHours: body.symptomDurationHours,
        nurseObs: body.nurseObservations,
        gcsScore: body.gcsScore,
        status: "PENDING_REVIEW",
        vitals: body.vitals
          ? {
              create: {
                heartRate: body.vitals.heartRate,
                systolicBp: body.vitals.systolicBp,
                diastolicBp: body.vitals.diastolicBp,
                oxygenSat: body.vitals.oxygenSaturation,
                respRate: body.vitals.respiratoryRate,
                temperature: body.vitals.temperatureCelsius,
                painScore: body.vitals.painScore,
              },
            }
          : undefined,
        assessment: {
          create: {
            esiLevel: assessment.esiLevel,
            acuityLabel: assessment.acuityLabel,
            confidenceScore: assessment.confidenceScore,
            primaryDrivers: JSON.stringify(assessment.primaryDrivers),
            recommendedRouting: assessment.recommendedRouting,
            reassessIntervalMinutes: assessment.reassessmentIntervalMinutes,
            clinicianReviewRequired: assessment.clinicianReviewRequired,
            requiresResuscitation: assessment.requiresImmediateResuscitation,
            missingCriticalData: JSON.stringify(assessment.missingCriticalData),
            patientExplanation: assessment.patientExplanation,
            clinicalRationale: assessment.clinicalRationale,
            safetyDisclaimer: assessment.safetyDisclaimer,
            aiProvider: assessment.aiProvider,
          },
        },
        redFlags: {
          create: assessment.detectedRedFlags.map((rf) => ({
            code: rf.code,
            category: rf.category,
            severity: rf.severity,
            description: rf.description,
            triggeredBy: rf.triggeredBy,
            deterministic: rf.deterministic,
          })),
        },
      },
      include: {
        patient: true,
        vitals: true,
        assessment: true,
        redFlags: true,
      },
    });

    // 4. Audit log
    await createAuditLog({
      action: "TRIAGE_INTAKE_SUBMITTED",
      actorRole: "PATIENT",
      entityType: "TriageSession",
      entityId: session.id,
      details: {
        patientId: patient.id,
        patientName: patient.name,
        chiefComplaint: body.chiefComplaint,
        assignedEsi: assessment.esiLevel,
        hasRedFlags: assessment.detectedRedFlags.length > 0,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      patientId: patient.id,
      assessment,
    });
  } catch (error: any) {
    console.error("Triage intake API error:", error);
    return NextResponse.json({ error: "Failed to process triage intake", details: error.message }, { status: 500 });
  }
}
