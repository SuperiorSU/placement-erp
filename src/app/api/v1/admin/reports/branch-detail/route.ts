import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";
import { BranchReportQuerySchema } from "@/lib/validations/report.schema";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api", querySchema: BranchReportQuerySchema },
  async (_req, { query }) => {
    const q = query as { branch: string; year?: string };
    const buffer = await ReportService.branchDetail(q.branch, q.year);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        XLSX_MIME,
        "Content-Disposition": `attachment; filename="branch-${q.branch.replace(/\s+/g, "-")}.xlsx"`,
      },
    });
  }
);
