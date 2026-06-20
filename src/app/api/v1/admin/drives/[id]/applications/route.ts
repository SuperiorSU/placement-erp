import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { ApplicationListQuerySchema } from "@/lib/validations/drive.schema";
import type { ApplicationListQuery } from "@/lib/validations/drive.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: ApplicationListQuerySchema },
  async (req: NextRequest, { query }) => {
    const parts   = req.nextUrl.pathname.split("/");
    const driveId = parts.at(-2)!; // /api/v1/admin/drives/{driveId}/applications
    const params  = query as ApplicationListQuery;
    const { items, total } = await DriveService.getApplications(driveId, params);
    return Response.json(ApiResponse.paginated(items, total, params.page, params.limit));
  }
);
