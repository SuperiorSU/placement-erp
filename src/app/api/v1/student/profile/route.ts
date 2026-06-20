import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";
import {
  UpdateStudentProfileSchema,
  type UpdateStudentProfileInput,
} from "@/lib/validations/student.schema";

export const GET = createRoute(
  { roles: ["STUDENT"], rateLimit: "api" },
  async (_req, { session }) => {
    const profile = await StudentService.getProfile(session!.user.id);
    return Response.json(ApiResponse.success(profile));
  }
);

export const PATCH = createRoute(
  {
    roles: ["STUDENT"],
    rateLimit: "api",
    bodySchema: UpdateStudentProfileSchema,
    action: "UPDATE_STUDENT_PROFILE",
  },
  async (_req, { session, body }) => {
    const profile = await StudentService.updateProfile(
      session!.user.id,
      body as UpdateStudentProfileInput
    );
    return Response.json(ApiResponse.success(profile));
  }
);
