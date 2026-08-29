import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const totalSessions = await prisma.triageSession.count();
    const pendingReview = await prisma.triageSession.count({ where: { status: "PENDING_REVIEW" } });
    const triaged = await prisma.triageSession.count({ where: { status: "TRIAGED" } });
    const overridden = await prisma.triageSession.count({ where: { status: "OVERRIDDEN" } });

    const redFlagsCount = await prisma.redFlagRecord.count();

    // Acuity breakdown
    const esi1 = await prisma.triageAssessment.count({ where: { esiLevel: 1 } });
    const esi2 = await prisma.triageAssessment.count({ where: { esiLevel: 2 } });
    const esi3 = await prisma.triageAssessment.count({ where: { esiLevel: 3 } });
    const esi4 = await prisma.triageAssessment.count({ where: { esiLevel: 4 } });
    const esi5 = await prisma.triageAssessment.count({ where: { esiLevel: 5 } });

    const overrideRate = totalSessions > 0 ? Math.round((overridden / totalSessions) * 100) : 0;

    return NextResponse.json({
      census: {
        total: totalSessions,
        pending: pendingReview,
        triaged,
        overridden,
        redFlagsCount,
        overrideRate,
      },
      acuityDistribution: {
        esi1,
        esi2,
        esi3,
        esi4,
        esi5,
      },
    });
  } catch (error: any) {
    console.error("Fetch stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats", details: error.message }, { status: 500 });
  }
}
