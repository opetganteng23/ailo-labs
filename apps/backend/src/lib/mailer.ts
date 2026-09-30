import nodemailer from "nodemailer";

type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Inline images referenced from `html` as <img src="cid:..."> (email clients block data: URIs). */
  attachments?: { filename: string; content: Buffer; cid?: string; contentType?: string }[];
};

/**
 * Sends an email via Gmail SMTP (Nodemailer) using APP_EMAIL / APP_PASSWORD.
 * Fails gracefully (never throws) when credentials are not configured so the
 * booking/admin flows that call this keep working without real SMTP creds.
 *
 * TODO: set APP_EMAIL (a Gmail address) and APP_PASSWORD (a Gmail App Password,
 * not the account password) in .env to make outbound email real.
 */
export async function sendMail(input: MailInput): Promise<{ sent: boolean }> {
  const user = process.env.APP_EMAIL;
  const pass = process.env.APP_PASSWORD;

  if (!user || !pass) {
    console.warn(
      `[mailer] APP_EMAIL/APP_PASSWORD not configured — skipping email to ${input.to} ("${input.subject}").`,
    );
    return { sent: false };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `AILO Lab <${user}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });

    return { sent: true };
  } catch (error) {
    console.warn("[mailer] Failed to send email", error);
    return { sent: false };
  }
}
