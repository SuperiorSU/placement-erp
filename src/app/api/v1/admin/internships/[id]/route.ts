import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { InternshipService } from "@/lib/services/internship.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import {
  UpdateInternshipSchema,
  type UpdateInternshipInput,
} from "@/lib/validations/internship.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
    async () => {
      const { id } = await params;
      const item = await InternshipService.getById(id);
      return Response.json(ApiResponse.success(item));
    }
  )(req);

export const PATCH = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    {
      roles: ["ADMIN"],
      rateLimit: "api",
      bodySchema: UpdateInternshipSchema,
      action: "UPDATE_INTERNSHIP",
    },
    async (req, { session, body }) => {
      const { id } = await params;
      const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
      if (!admin) throw new NotFoundError("Admin profile not found");

      const item = await InternshipService.update(
        id,
        body as UpdateInternshipInput,
        admin.id,
        req.headers.get("x-forwarded-for") ?? undefined
      );
      return Response.json(ApiResponse.success(item));
    }
  )(req);
