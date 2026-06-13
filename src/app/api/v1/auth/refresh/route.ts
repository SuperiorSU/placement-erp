import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/db/prisma";

export const GET = createRoute(
  { roles: ["STUDENT", "ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (_req, { session }) => {
    // Return the latest user info from DB (in case role/status changed)
    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id:          true,
        email:       true,
        role:        true,
        isActive:    true,
        lastLoginAt: true,
        createdAt:   true,
      },
    });

    if (!user || !user.isActive) {
      return Response.json(
        ApiResponse.error("AUTH_002", "Account is deactivated"),
        { status: 403 }
      );
    }

    return Response.json(ApiResponse.success({ user }));
  }
);
