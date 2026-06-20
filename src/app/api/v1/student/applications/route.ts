import { z } from "zod";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";
import { PaginationSchema } from "@/lib/validations/shared.schema";

const QuerySchema = PaginationSchema.extend({
  stage: z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"]).optional(),
});

export const GET = createRoute(
  { roles: ["STUDENT"], rateLimit: "api", querySchema: QuerySchema },
  async (_req, { session, query }) => {
    const q = query as { page: number; limit: number; stage?: any };
    const { items, total } = await StudentService.getApplications(session!.user.id, q);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);
