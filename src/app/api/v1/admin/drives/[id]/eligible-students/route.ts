import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (req: NextRequest) => {
    const driveId = req.nextUrl.pathname.split("/").at(-2)!; // /api/v1/admin/drives/{driveId}/eligible-students
    const q       = req.nextUrl.searchParams.get("q") ?? undefined;
    const students = await DriveService.getEligibleStudents(driveId, q);
    return Response.json(ApiResponse.success(students));
  }
);
