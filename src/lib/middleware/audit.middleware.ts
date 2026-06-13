import { prisma } from "@/lib/db/prisma";

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  await prisma.activityLog.create({
    data: { userId, action, resource, resourceId, metadata, ipAddress },
  });
}
