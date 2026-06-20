import { z } from "zod";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { SuperAdminService } from "@/lib/services/super-admin.service";
import { PaginationSchema } from "@/lib/validations/shared.schema";

const AdminListQuerySchema = PaginationSchema.extend({
  q: z.string().max(200).trim().optional(),
});

const CreateAdminSchema = z.object({
  name:       z.string().min(1, "Name is required").max(200).trim(),
  email:      z.string().email("Invalid email").toLowerCase(),
  password:   z.string().min(8, "Password must be at least 8 characters").max(100),
  phone:      z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional(),
  department: z.string().max(200).trim().optional(),
});

export const GET = createRoute(
  { roles: ["SUPER_ADMIN"], rateLimit: "api", querySchema: AdminListQuerySchema },
  async (_req, { query }) => {
    const q = query as { page: number; limit: number; q?: string };
    const { items, total } = await SuperAdminService.listAdmins(q);
    return Response.json(ApiResponse.paginated(items, total, q.page, q.limit));
  }
);

export const POST = createRoute(
  {
    roles: ["SUPER_ADMIN"],
    rateLimit: "api",
    bodySchema: CreateAdminSchema,
    action: "CREATE_ADMIN",
  },
  async (req, { session, body }) => {
    const data = body as z.infer<typeof CreateAdminSchema>;
    const item = await SuperAdminService.createAdmin(data, session!.user.id, req.headers.get("x-forwarded-for") ?? undefined);
    return Response.json(ApiResponse.success(item), { status: 201 });
  }
);
