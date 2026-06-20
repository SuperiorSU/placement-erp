import nodemailer from "nodemailer";

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = createTransport();
  if (!transport) return;
  await transport.sendMail({ from: process.env.SMTP_USER, to, subject, html });
}

export async function sendInternshipAlertEmail(
  to: string,
  studentName: string,
  company: string,
  endDate: Date
): Promise<void> {
  const formatted = endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  await sendEmail(
    to,
    `Internship ending soon — ${company}`,
    `<p>Hi ${studentName},</p>
     <p>Your internship at <strong>${company}</strong> ends on <strong>${formatted}</strong>.</p>
     <p>Please update your placement status in the portal.</p>
     <p>Regards,<br/>Placement Cell</p>`
  );
}

export async function sendConsentSignedEmail(
  to: string,
  studentName: string,
  formTitle: string
): Promise<void> {
  await sendEmail(
    to,
    `Consent form signed — ${formTitle}`,
    `<p>Hi ${studentName},</p>
     <p>Your consent form "<strong>${formTitle}</strong>" has been signed successfully.</p>
     <p>Regards,<br/>Placement Cell</p>`
  );
}
