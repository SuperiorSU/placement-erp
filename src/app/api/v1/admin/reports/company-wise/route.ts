import { createRoute } from "@/lib/utils/route-handler";
import { ReportService } from "@/lib/services/report.service";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const GET = createRoute(
  { roles: ["ADMIN", "SUPER_ADMIN"], rateLimit: "api" },
  async (req) => {
    const year = req.nextUrl.searchParams.get("year") ?? new Date().getFullYear().toString();
    const buffer = await ReportService.companyWise(year);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="company-wise-${year}.xlsx"`,
      },
    });
  }
);
