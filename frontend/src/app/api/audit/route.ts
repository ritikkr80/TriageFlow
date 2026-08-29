import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const role = searchParams.get("role");

    const where: any = {};
    if (action && action !== "ALL") where.action = action;
    if (role && role !== "ALL") where.actorRole = role;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
      include: {
        user: true,
      },
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      action: l.action,
      actorName: l.user?.name || "Automated System",
      actorRole: l.actorRole,
      entityType: l.entityType,
      entityId: l.entityId || undefined,
      details: JSON.parse(l.details || "{}"),
      ipAddress: l.ipAddress || undefined,
      timestamp: l.timestamp.toISOString(),
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error: any) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs", details: error.message }, { status: 500 });
  }
}
