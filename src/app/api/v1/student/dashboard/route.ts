import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";

export const GET = createRoute(
  { roles: ["STUDENT"], rateLimit: "api" },
  async (_req, { session }) => {
    const profile = await StudentService.getProfile(session!.user.id);
    return Response.json(ApiResponse.success(profile));
  }
);
