import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { ConsentService } from "@/lib/services/consent.service";
import {
  ConsentSignatureListQuerySchema,
  type ConsentSignatureListQuery,
} from "@/lib/validations/consent.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: ConsentSignatureListQuerySchema },
    async (_req, { query }) => {
      const { id } = await params;
      const q = query as ConsentSignatureListQuery;
      const { items, total } = await ConsentService.getSignatures(id, q);
      return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
    }
  )(req);
