import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { CompanyService } from "@/lib/services/company.service";
import { CreateCompanySchema, CompanyListQuerySchema } from "@/lib/validations/company.schema";
import type { CreateCompanyInput, CompanyListQuery } from "@/lib/validations/company.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: CompanyListQuerySchema },
  async (_req, { query }) => {
    const params = query as CompanyListQuery;
    const { items, total } = await CompanyService.list(params);
    return Response.json(
      ApiResponse.paginated(items, total, params.page, params.limit)
    );
  }
);

export const POST = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: CreateCompanySchema, action: "CREATE_COMPANY" },
  async (_req, { session, body }) => {
    const company = await CompanyService.create(body as CreateCompanyInput, session!.user.id);
    return Response.json(ApiResponse.success(company), { status: 201 });
  }
);
