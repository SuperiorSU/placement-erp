import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { SuperAdminService } from "@/lib/services/super-admin.service";

export const GET = createRoute(
  { roles: ["SUPER_ADMIN"], rateLimit: "api" },
  async () => {
    const stats = await SuperAdminService.getDashboardStats();
    return Response.json(ApiResponse.success(stats));
  }
);
