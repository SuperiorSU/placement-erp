import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";
import { YearlyCompaniesQuerySchema } from "@/lib/validations/report.schema";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: YearlyCompaniesQuerySchema },
  async (_req, { query }) => {
    const q = query as { year: string };
    const buffer = await ReportService.yearAllCompanies(q.year);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        XLSX_MIME,
        "Content-Disposition": `attachment; filename="yearly-companies-${q.year}.xlsx"`,
      },
    });
  }
);
