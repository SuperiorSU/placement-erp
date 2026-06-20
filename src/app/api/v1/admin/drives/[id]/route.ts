import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { UpdateDriveSchema } from "@/lib/validations/drive.schema";
import type { UpdateDriveInput } from "@/lib/validations/drive.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (req: NextRequest) => {
    const id    = req.nextUrl.pathname.split("/").at(-1)!;
    const drive = await DriveService.getById(id);
    return Response.json(ApiResponse.success(drive));
  }
);

export const PATCH = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: UpdateDriveSchema, action: "UPDATE_DRIVE" },
  async (req: NextRequest, { session, body }) => {
    const id    = req.nextUrl.pathname.split("/").at(-1)!;
    const drive = await DriveService.update(id, body as UpdateDriveInput, session!.user.id);
    return Response.json(ApiResponse.success(drive));
  }
);

export const DELETE = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", action: "DELETE_DRIVE" },
  async (req: NextRequest, { session }) => {
    const id = req.nextUrl.pathname.split("/").at(-1)!;
    await DriveService.delete(id, session!.user.id);
    return Response.json(ApiResponse.success(null));
  }
);
