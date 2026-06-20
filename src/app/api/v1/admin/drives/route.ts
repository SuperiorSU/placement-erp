import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { DriveService } from "@/lib/services/drive.service";
import { DriveListQuerySchema, CreateDriveSchema } from "@/lib/validations/drive.schema";
import type { DriveListQuery, CreateDriveInput } from "@/lib/validations/drive.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: DriveListQuerySchema },
  async (_req, { query }) => {
    const params = query as DriveListQuery;
    const { items, total } = await DriveService.list(params);
    return Response.json(ApiResponse.paginated(items, total, params.page, params.limit));
  }
);

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateDriveSchema, action: "CREATE_DRIVE" },
  async (_req, { session, body }) => {
    const drive = await DriveService.create(body as CreateDriveInput, session!.user.id);
    return Response.json(ApiResponse.success(drive), { status: 201 });
  }
);
