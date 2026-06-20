import { type NextRequest } from "next/server";
import { InternshipService } from "@/lib/services/internship.service";
import { sendInternshipAlertEmail } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await InternshipService.getAlertsToSend();
  const sent: string[] = [];

  for (const alert of alerts) {
    try {
      await sendInternshipAlertEmail(
        alert.studentEmail,
        alert.studentName,
        alert.company,
        alert.endDate
      );
      sent.push(alert.id);
    } catch {
      // Continue sending to other students even if one email fails
    }
  }

  if (sent.length > 0) {
    await InternshipService.markAlertSent(sent);
  }

  return Response.json({ sent: sent.length, total: alerts.length });
}
