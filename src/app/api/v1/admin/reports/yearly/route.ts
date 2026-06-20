import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async () => {
    const buffer = await ReportService.yearly();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="yearly-summary.xlsx"`,
      },
    });
  }
);
