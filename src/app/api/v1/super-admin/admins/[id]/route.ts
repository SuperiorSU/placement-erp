import { z } from "zod";
import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { SuperAdminService } from "@/lib/services/super-admin.service";

const UpdateAdminSchema = z.object({
  name:       z.string().min(1).max(200).trim().optional(),
  phone:      z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional().nullable(),
  department: z.string().max(200).trim().optional(),
  isActive:   z.boolean().optional(),
});

export const PATCH = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    {
      roles: ["SUPER_ADMIN"],
      rateLimit: "api",
      bodySchema: UpdateAdminSchema,
      action: "UPDATE_ADMIN",
    },
    async (req, { session, body }) => {
      const { id } = await params;
      const data = body as z.infer<typeof UpdateAdminSchema>;
      const item = await SuperAdminService.updateAdmin(id, data as any, session!.user.id, req.headers.get("x-forwarded-for") ?? undefined);
      return Response.json(ApiResponse.success(item));
    }
  )(req);

export const DELETE = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["SUPER_ADMIN"], rateLimit: "api", action: "DEACTIVATE_ADMIN" },
    async (req, { session }) => {
      const { id } = await params;
      await SuperAdminService.deleteAdmin(id, session!.user.id, req.headers.get("x-forwarded-for") ?? undefined);
      return Response.json(ApiResponse.success(null));
    }
  )(req);
