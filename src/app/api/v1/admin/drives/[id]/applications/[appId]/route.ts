import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { UpdateFunnelStageSchema } from "@/lib/validations/drive.schema";
import type { UpdateFunnelStageInput } from "@/lib/validations/drive.schema";

export const PATCH = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: UpdateFunnelStageSchema, action: "UPDATE_FUNNEL_STAGE" },
  async (req: NextRequest, { session, body }) => {
    const parts   = req.nextUrl.pathname.split("/");
    const appId   = parts.at(-1)!;   // last segment
    const driveId = parts.at(-3)!;   // /api/v1/admin/drives/{driveId}/applications/{appId}
    const app = await DriveService.updateFunnelStage(
      driveId,
      appId,
      body as UpdateFunnelStageInput,
      session!.user.id
    );
    return Response.json(ApiResponse.success(app));
  }
);
