import { NextResponse } from "next/server";
import { sendLeadNotificationEmail } from "@/lib/email/smtp";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ContactPayload = {
  fullName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  projectType?: string;
  budgetRange?: string;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Iletisim servisi icin servis anahtari eksik." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as ContactPayload;
  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (!fullName || !email || !message) {
    return NextResponse.json(
      { error: "Ad soyad, e-posta ve mesaj zorunludur." },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Gecerli bir e-posta girin." }, { status: 400 });
  }

  const { error } = await admin.from("contact_requests").insert({
    full_name: fullName,
    company_name: body.companyName?.trim() || null,
    email,
    phone: body.phone?.trim() || null,
    project_type: body.projectType?.trim() || null,
    budget_range: body.budgetRange?.trim() || null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "Talep kaydedilemedi." }, { status: 500 });
  }

  const emailResult = await sendLeadNotificationEmail({
    fullName,
    companyName: body.companyName?.trim() || null,
    email,
    phone: body.phone?.trim() || null,
    projectType: body.projectType?.trim() || null,
    budgetRange: body.budgetRange?.trim() || null,
    message,
  });

  await admin.from("email_logs").insert({
    channel: "smtp",
    event_type: "contact_request_notification",
    recipient_email: process.env.SALES_INBOX_EMAIL ?? null,
    sender_email: process.env.SMTP_FROM_EMAIL ?? null,
    subject: `Yeni teklif talebi - ${fullName}`,
    status: emailResult.ok ? "sent" : "failed",
    provider_message_id: emailResult.messageId,
    error_message: emailResult.error,
    payload: {
      fullName,
      companyName: body.companyName?.trim() || null,
      email,
      phone: body.phone?.trim() || null,
      projectType: body.projectType?.trim() || null,
      budgetRange: body.budgetRange?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    emailNotification: emailResult.ok ? "sent" : "failed",
  });
}
