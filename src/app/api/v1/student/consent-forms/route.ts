import { z } from "zod";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";
import { PaginationSchema } from "@/lib/validations/shared.schema";

const QuerySchema = PaginationSchema.extend({
  status: z.enum(["PENDING", "SIGNED", "DECLINED"]).optional(),
});

export const GET = createRoute(
  { roles: ["STUDENT"], rateLimit: "api", querySchema: QuerySchema },
  async (_req, { session, query }) => {
    const q = query as { page: number; limit: number; status?: any };
    const { items, total } = await StudentService.getConsentForms(session!.user.id, q);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);
