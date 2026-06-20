import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { InternshipService } from "@/lib/services/internship.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import {
  InternshipListQuerySchema,
  CreateInternshipSchema,
  type InternshipListQuery,
  type CreateInternshipInput,
} from "@/lib/validations/internship.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: InternshipListQuerySchema },
  async (_req, { query }) => {
    const { items, total } = await InternshipService.list(query as InternshipListQuery);
    const q = query as InternshipListQuery;
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);

export const POST = createRoute(
  {
    roles: ["ADMIN"],
    rateLimit: "api",
    bodySchema: CreateInternshipSchema,
    action: "CREATE_INTERNSHIP",
  },
  async (req, { session, body }) => {
    const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
    if (!admin) throw new NotFoundError("Admin profile not found");

    const item = await InternshipService.create(
      body as CreateInternshipInput,
      admin.id,
      req.headers.get("x-forwarded-for") ?? undefined
    );
    return Response.json(ApiResponse.success(item), { status: 201 });
  }
);
