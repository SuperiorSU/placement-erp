import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";
import { CompanyReportQuerySchema } from "@/lib/validations/report.schema";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: CompanyReportQuerySchema },
  async (_req, { query }) => {
    const q = query as { companyId: string };
    const buffer = await ReportService.companyAllDrives(q.companyId);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        XLSX_MIME,
        "Content-Disposition": `attachment; filename="company-all-drives.xlsx"`,
      },
    });
  }
);
