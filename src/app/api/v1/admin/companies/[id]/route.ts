import { type NextRequest } from "next/server";
import { createRoute } from "@/lib/utils/route-handler";
import { ApiResponse } from "@/lib/utils/api-response";
import { CompanyService } from "@/lib/services/company.service";
import { UpdateCompanySchema } from "@/lib/validations/company.schema";
import type { UpdateCompanyInput } from "@/lib/validations/company.schema";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (req: NextRequest, { }) => {
    const id      = req.nextUrl.pathname.split("/").at(-1)!;
    const company = await CompanyService.getById(id);
    return Response.json(ApiResponse.success(company));
  }
);

export const PATCH = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", bodySchema: UpdateCompanySchema, action: "UPDATE_COMPANY" },
  async (req: NextRequest, { session, body }) => {
    const id      = req.nextUrl.pathname.split("/").at(-1)!;
    const company = await CompanyService.update(id, body as UpdateCompanyInput, session!.user.id);
    return Response.json(ApiResponse.success(company));
  }
);

export const DELETE = createRoute(
  { roles: ["ADMIN"], rateLimit: "api", action: "DELETE_COMPANY" },
  async (req: NextRequest, { session }) => {
    const id = req.nextUrl.pathname.split("/").at(-1)!;
    await CompanyService.delete(id, session!.user.id);
    return Response.json(ApiResponse.success(null));
  }
);
