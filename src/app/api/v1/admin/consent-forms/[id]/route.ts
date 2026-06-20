import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { ConsentService } from "@/lib/services/consent.service";
import { NotFoundError } from "@/lib/utils/errors";
import { prisma } from "@/lib/db/prisma";
import {
  UpdateConsentFormSchema,
  type UpdateConsentFormInput,
} from "@/lib/validations/consent.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
    async () => {
      const { id } = await params;
      const item = await ConsentService.getById(id);
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
      bodySchema: UpdateConsentFormSchema,
      action: "UPDATE_CONSENT_FORM",
    },
    async (req, { session, body }) => {
      const { id } = await params;
      const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
      if (!admin) throw new NotFoundError("Admin profile not found");

      const item = await ConsentService.update(
        id,
        body as UpdateConsentFormInput,
        admin.id,
        req.headers.get("x-forwarded-for") ?? undefined
      );
      return Response.json(ApiResponse.success(item));
    }
  )(req);

export const DELETE = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN"], rateLimit: "api", action: "DELETE_CONSENT_FORM" },
    async (req, { session }) => {
      const { id } = await params;
      const admin = await prisma.admin.findUnique({ where: { userId: session!.user.id } });
      if (!admin) throw new NotFoundError("Admin profile not found");

      await ConsentService.delete(id, admin.id, req.headers.get("x-forwarded-for") ?? undefined);
      return Response.json(ApiResponse.success(null));
    }
  )(req);
