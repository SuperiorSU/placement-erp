import { prisma } from "@/lib/db/prisma";

/**
 * Checks that a user exists and is still active.
 * Called after auth() returns a session to catch deactivated-mid-session cases.
 */
export async function assertUserActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  return user?.isActive === true;
}
