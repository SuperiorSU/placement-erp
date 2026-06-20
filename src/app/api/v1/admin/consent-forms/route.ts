import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { ConsentService } from "@/lib/services/consent.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import {
  ConsentFormListQuerySchema,
  CreateConsentFormSchema,
  type ConsentFormListQuery,
  type CreateConsentFormInput,
} from "@/lib/validations/consent.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: ConsentFormListQuerySchema },
  async (_req, { query }) => {
    const q = query as ConsentFormListQuery;
    const { items, total } = await ConsentService.list(q);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);

export const POST = createRoute(
  {
    roles: ["ADMIN"],
    rateLimit: "api",
    bodySchema: CreateConsentFormSchema,
    action: "CREATE_CONSENT_FORM",
  },
  async (req, { session, body }) => {
    const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
    if (!admin) throw new NotFoundError("Admin profile not found");

    const item = await ConsentService.create(
      body as CreateConsentFormInput,
      admin.id,
      req.headers.get("x-forwarded-for") ?? undefined
    );
    return Response.json(ApiResponse.success(item), { status: 201 });
  }
);
