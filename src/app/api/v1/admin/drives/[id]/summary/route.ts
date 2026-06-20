import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
    async () => {
      const { id } = await params;
      const summary = await DriveService.getDriveSummary(id);
      return Response.json(ApiResponse.success(summary));
    }
  )(req);
