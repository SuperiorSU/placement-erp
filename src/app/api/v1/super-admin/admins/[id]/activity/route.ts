import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { SuperAdminService } from "@/lib/services/super-admin.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import { PaginationSchema } from "@/lib/validations/shared.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["SUPER_ADMIN"], rateLimit: "api", querySchema: PaginationSchema },
    async (_req, { query }) => {
      const { id } = await params;

      const admin = await prisma.admin.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!admin) throw new NotFoundError("Admin not found");

      const q = query as { page: number; limit: number };
      const { items, total } = await SuperAdminService.getAdminActivity(admin.userId, q);
      return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
    }
  )(req);
