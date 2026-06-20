import { z } from "zod";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";
import { PaginationSchema } from "@/lib/validations/shared.schema";

const DriveListQuerySchema = PaginationSchema.extend({
  status: z.enum(["ACTIVE", "UPCOMING", "COMPLETED"]).optional(),
  q:      z.string().max(200).trim().optional(),
});

export const GET = createRoute(
  { roles: ["STUDENT"], rateLimit: "api", querySchema: DriveListQuerySchema },
  async (_req, { session, query }) => {
    const q = query as { status?: string; q?: string; page: number; limit: number };
    const { items, total } = await StudentService.browseDrives(q, session!.user.id);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);
