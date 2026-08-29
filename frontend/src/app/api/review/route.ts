import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, confirmedEsi, isOverride, overrideReason, reviewNotes, clinicianId } = body;

    if (!sessionId || confirmedEsi === undefined) {
      return NextResponse.json({ error: "Missing sessionId or confirmedEsi" }, { status: 400 });
    }

    if (isOverride && !overrideReason) {
      return NextResponse.json({ error: "Mandatory override reason is required for clinician overrides" }, { status: 400 });
    }

    // Default to the first available clinician if not provided
    let activeClinicianId = clinicianId;
    if (!activeClinicianId) {
      const defaultClinician = await prisma.clinician.findFirst();
      if (defaultClinician) activeClinicianId = defaultClinician.id;
    }

    if (!activeClinicianId) {
      return NextResponse.json({ error: "No authorized clinician record found" }, { status: 403 });
    }

    // 1. Create Clinician Review record
    const review = await prisma.clinicianReview.create({
      data: {
        sessionId,
        clinicianId: activeClinicianId,
        confirmedEsi: parseInt(confirmedEsi, 10),
        isOverride: Boolean(isOverride),
        overrideReason: isOverride ? overrideReason : null,
        reviewNotes: reviewNotes || null,
      },
      include: {
        clinician: { include: { user: true } },
      },
    });

    // 2. Update Triage Session status
    const newStatus = isOverride ? "OVERRIDDEN" : "TRIAGED";
    const updatedSession = await prisma.triageSession.update({
      where: { id: sessionId },
      data: { status: newStatus },
      include: { patient: true, assessment: true },
    });

    // 3. Log Audit Record
    await createAuditLog({
      action: isOverride ? "CLINICIAN_TRIAGE_OVERRIDE" : "CLINICIAN_TRIAGE_CONFIRMED",
      actorId: review.clinician.userId,
      actorRole: "NURSE",
      entityType: "TriageSession",
      entityId: sessionId,
      details: {
        patientName: updatedSession.patient.name,
        aiEsi: updatedSession.assessment?.esiLevel,
        confirmedEsi: parseInt(confirmedEsi, 10),
        isOverride: Boolean(isOverride),
        overrideReason: overrideReason || "Clinician confirmed AI recommendation",
        notes: reviewNotes || "",
      },
    });

    return NextResponse.json({
      success: true,
      reviewId: review.id,
      newStatus,
      confirmedEsi: review.confirmedEsi,
    });
  } catch (error: any) {
    console.error("Clinician review API error:", error);
    return NextResponse.json({ error: "Failed to record clinician review", details: error.message }, { status: 500 });
  }
}
