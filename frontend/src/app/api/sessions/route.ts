import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const esi = searchParams.get("esi");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (esi && esi !== "ALL") {
      where.assessment = {
        esiLevel: parseInt(esi, 10),
      };
    }

    const sessions = await prisma.triageSession.findMany({
      where,
      orderBy: [
        { assessment: { esiLevel: "asc" } },
        { createdAt: "desc" },
      ],
      include: {
        patient: true,
        vitals: true,
        assessment: true,
        redFlags: true,
        reviews: {
          include: {
            clinician: {
              include: { user: true },
            },
          },
        },
      },
    });

    const formatted = sessions.map((s) => {
      const latestReview = s.reviews[0];
      return {
        id: s.id,
        patientId: s.patientId,
        patient: {
          name: s.patient.name,
          age: s.patient.age,
          sex: s.patient.sex,
          allergies: JSON.parse(s.patient.allergies || "[]"),
          medicalHistory: JSON.parse(s.patient.medicalHistory || "[]"),
          currentMeds: JSON.parse(s.patient.currentMeds || "[]"),
        },
        arrivalMode: s.arrivalMode,
        chiefComplaint: s.chiefComplaint,
        symptoms: JSON.parse(s.symptoms || "[]"),
        durationHours: s.durationHours,
        nurseObs: s.nurseObs,
        gcsScore: s.gcsScore,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        vitals: s.vitals
          ? {
              heartRate: s.vitals.heartRate ?? undefined,
              systolicBp: s.vitals.systolicBp ?? undefined,
              diastolicBp: s.vitals.diastolicBp ?? undefined,
              oxygenSaturation: s.vitals.oxygenSat ?? undefined,
              respiratoryRate: s.vitals.respRate ?? undefined,
              temperatureCelsius: s.vitals.temperature ?? undefined,
              painScore: s.vitals.painScore ?? undefined,
            }
          : undefined,
        assessment: s.assessment
          ? {
              esiLevel: s.assessment.esiLevel,
              acuityLabel: s.assessment.acuityLabel,
              confidenceScore: s.assessment.confidenceScore,
              primaryDrivers: JSON.parse(s.assessment.primaryDrivers || "[]"),
              recommendedRouting: s.assessment.recommendedRouting,
              reassessmentIntervalMinutes: s.assessment.reassessIntervalMinutes,
              clinicianReviewRequired: s.assessment.clinicianReviewRequired,
              requiresImmediateResuscitation: s.assessment.requiresResuscitation,
              missingCriticalData: JSON.parse(s.assessment.missingCriticalData || "[]"),
              patientExplanation: s.assessment.patientExplanation,
              clinicalRationale: s.assessment.clinicalRationale,
              safetyDisclaimer: s.assessment.safetyDisclaimer,
              aiProvider: s.assessment.aiProvider,
              evaluatedAt: s.assessment.evaluatedAt.toISOString(),
            }
          : undefined,
        redFlags: s.redFlags.map((rf) => ({
          code: rf.code,
          category: rf.category,
          severity: rf.severity as "CRITICAL" | "HIGH" | "MODERATE",
          description: rf.description,
          triggeredBy: rf.triggeredBy,
          deterministic: rf.deterministic,
        })),
        review: latestReview
          ? {
              id: latestReview.id,
              clinicianName: latestReview.clinician.user.name,
              confirmedEsi: latestReview.confirmedEsi,
              isOverride: latestReview.isOverride,
              overrideReason: latestReview.overrideReason || undefined,
              reviewNotes: latestReview.reviewNotes || undefined,
              reviewedAt: latestReview.reviewedAt.toISOString(),
            }
          : undefined,
      };
    });

    return NextResponse.json({ sessions: formatted });
  } catch (error: any) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch triage sessions", details: error.message }, { status: 500 });
  }
}
