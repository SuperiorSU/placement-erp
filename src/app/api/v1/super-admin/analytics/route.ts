import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { SuperAdminService } from "@/lib/services/super-admin.service";

export const GET = createRoute(
  { roles: ["SUPER_ADMIN"], rateLimit: "api" },
  async (req) => {
    const year = req.nextUrl.searchParams.get("year") ?? new Date().getFullYear().toString();
    const data = await SuperAdminService.getAnalytics(year);
    return Response.json(ApiResponse.success(data));
  }
);
