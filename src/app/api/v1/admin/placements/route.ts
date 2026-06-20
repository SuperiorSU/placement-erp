import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { PlacementService } from "@/lib/services/placement.service";
import {
  PlacementListQuerySchema,
  type PlacementListQuery,
} from "@/lib/validations/placement.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: PlacementListQuerySchema },
  async (_req, { query }) => {
    const q = query as PlacementListQuery;
    const { items, total } = await PlacementService.list(q);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);
