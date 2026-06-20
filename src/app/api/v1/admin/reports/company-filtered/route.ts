import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";
import { CompanyReportQuerySchema } from "@/lib/validations/report.schema";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: CompanyReportQuerySchema },
  async (_req, { query }) => {
    const q = query as { companyId: string; year?: string; month?: number };
    const buffer = await ReportService.companyFiltered(q.companyId, q.year, q.month);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        XLSX_MIME,
        "Content-Disposition": `attachment; filename="company-filtered-drives.xlsx"`,
      },
    });
  }
);
