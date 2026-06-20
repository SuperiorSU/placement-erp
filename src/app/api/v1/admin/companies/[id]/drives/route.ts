import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { CompanyService } from "@/lib/services/company.service";
import { CompanyDriveHistoryQuerySchema } from "@/lib/validations/drive.schema";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: CompanyDriveHistoryQuerySchema },
    async (_req, { query }) => {
      const { id } = await params;
      const q = query as { page: number; limit: number; dir: "asc" | "desc"; year?: string; status?: string };
      const { items, total } = await CompanyService.getDriveHistory(id, q as Parameters<typeof CompanyService.getDriveHistory>[1]);
      return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
    }
  )(req);
