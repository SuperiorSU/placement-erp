import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { prisma } from "@/lib/db/prisma";

export const GET = createRoute(
  { roles: ["ADMIN"], rateLimit: "api" },
  async () => {
    const [
      companyCount,
      driveGroups,
      enrollmentCount,
      placementCount,
    ] = await Promise.all([
      prisma.company.count({ where: { deletedAt: null } }),
      prisma.drive.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.driveApplication.count(),
      prisma.driveApplication.count({ where: { stage: "OFFERED" } }),
    ]);

    const driveCounts = Object.fromEntries(
      driveGroups.map((g) => [g.status, g._count.id])
    );

    return Response.json(ApiResponse.success({
      companies:   companyCount,
      drives:      Object.values(driveCounts).reduce((s, n) => s + n, 0),
      active:      driveCounts["ACTIVE"]   ?? 0,
      upcoming:    driveCounts["UPCOMING"] ?? 0,
      enrollments: enrollmentCount,
      placements:  placementCount,
    }));
  }
);
