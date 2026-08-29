import { prisma } from "./db";

export interface LogAuditParams {
  action: string;
  actorId?: string;
  actorRole: "PATIENT" | "NURSE" | "PHYSICIAN" | "ADMIN" | "SYSTEM";
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function createAuditLog(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId,
        actorRole: params.actorRole,
        entityType: params.entityType,
        entityId: params.entityId,
        details: JSON.stringify(params.details || {}),
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error("Audit logging error:", error);
    return null;
  }
}
