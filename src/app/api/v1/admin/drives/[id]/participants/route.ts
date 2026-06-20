import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { DriveParticipantQuerySchema, type DriveParticipantQuery } from "@/lib/validations/drive.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: DriveParticipantQuerySchema },
    async (_req, { query }) => {
      const { id } = await params;
      const q = query as DriveParticipantQuery;
      const { items, total } = await DriveService.getParticipants(id, q);
      return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
    }
  )(req);
