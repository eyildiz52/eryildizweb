import nodemailer from "nodemailer";

type LeadMailPayload = {
  fullName: string;
  companyName?: string | null;
  email: string;
  phone?: string | null;
  projectType?: string | null;
  budgetRange?: string | null;
  message: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = String(process.env.SMTP_SECURE ?? "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const inboxEmail = process.env.SALES_INBOX_EMAIL;

  if (!host || !user || !pass || !fromEmail || !inboxEmail) {
    return null;
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    inboxEmail,
  };
}

export function isSmtpEnabled() {
  return Boolean(getSmtpConfig());
}

export async function sendLeadNotificationEmail(payload: LeadMailPayload) {
  const config = getSmtpConfig();
  if (!config) {
    return {
      ok: false,
      error: "SMTP ayarlari eksik.",
      messageId: null as string | null,
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const subject = `Yeni teklif talebi - ${payload.fullName}`;
  const textBody = [
    `Ad Soyad: ${payload.fullName}`,
    `Firma: ${payload.companyName ?? "-"}`,
    `E-posta: ${payload.email}`,
    `Telefon: ${payload.phone ?? "-"}`,
    `Proje Turu: ${payload.projectType ?? "-"}`,
    `Butce: ${payload.budgetRange ?? "-"}`,
    "",
    "Mesaj:",
    payload.message,
  ].join("\n");

  try {
    const info = await transporter.sendMail({
      from: config.fromEmail,
      to: config.inboxEmail,
      replyTo: payload.email,
      subject,
      text: textBody,
    });

    return {
      ok: true,
      error: null as string | null,
      messageId: info.messageId ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Bilinmeyen SMTP hatasi",
      messageId: null as string | null,
    };
  }
}
