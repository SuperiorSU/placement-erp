import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse, ErrorCodes } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "upload" },
  async (req: NextRequest, { session }) => {
    const driveId = req.nextUrl.pathname.split("/").at(-2)!; // /api/v1/admin/drives/{driveId}/bulk-enroll

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return Response.json(
        ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Expected multipart/form-data"),
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json(
        ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "No file provided. Include a file field named 'file'"),
        { status: 400 }
      );
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return Response.json(
        ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "Only .xlsx or .xls files are supported"),
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        ApiResponse.error(ErrorCodes.VALIDATION_ERROR, "File must be under 5 MB"),
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await DriveService.bulkEnroll(driveId, buffer, session!.user.id);

    return Response.json(ApiResponse.success(result));
  }
);
