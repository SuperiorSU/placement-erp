import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { StudentService } from "@/lib/services/student.service";

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) =>
  createRoute(
    { roles: ["STUDENT"], rateLimit: "api" },
    async (_req, { session }) => {
      const { id } = await params;
      const drive = await StudentService.getDriveById(id, session!.user.id);
      return Response.json(ApiResponse.success(drive));
    }
  )(req);
