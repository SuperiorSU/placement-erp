import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { EnrollStudentSchema } from "@/lib/validations/drive.schema";
import type { EnrollStudentInput } from "@/lib/validations/drive.schema";

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: EnrollStudentSchema, action: "ENROLL_STUDENT" },
  async (req: NextRequest, { session, body }) => {
    const driveId = req.nextUrl.pathname.split("/").at(-2)!; // /api/v1/admin/drives/{driveId}/enroll
    const app = await DriveService.enrollStudent(driveId, body as EnrollStudentInput, session!.user.id);
    return Response.json(ApiResponse.success(app), { status: 201 });
  }
);
