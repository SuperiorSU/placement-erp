import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { PlacementService } from "@/lib/services/placement.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import {
  CreateManualPlacementSchema,
  type CreateManualPlacementInput,
} from "@/lib/validations/placement.schema";

export const POST = createRoute(
  {
    roles: ["ADMIN"],
    rateLimit: "api",
    bodySchema: CreateManualPlacementSchema,
    action: "CREATE_MANUAL_PLACEMENT",
  },
  async (req, { session, body }) => {
    const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
    if (!admin) throw new NotFoundError("Admin profile not found");

    const item = await PlacementService.createManual(
      body as CreateManualPlacementInput,
      admin.id,
      req.headers.get("x-forwarded-for") ?? undefined
    );
    return Response.json(ApiResponse.success(item), { status: 201 });
  }
);
