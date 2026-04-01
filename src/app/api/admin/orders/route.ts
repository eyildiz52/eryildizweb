import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type OrderPatchRequest = {
  orderId?: string;
  status?: "pending" | "paid" | "failed" | "refunded";
};

export async function GET(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servis anahtari eksik." },
      { status: 503 }
    );
  }

  const status = new URL(request.url).searchParams.get("status")?.trim().toLowerCase();
  const allowedStatuses = ["pending", "paid", "failed", "refunded"];
  const normalizedStatus = status && allowedStatuses.includes(status) ? status : null;

  let query = admin
    .from("orders")
    .select("id,user_id,package_id,amount,currency,payment_status,payment_reference,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (normalizedStatus) {
    query = query.eq("payment_status", normalizedStatus);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Siparisler alinamadi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, orders: data ?? [] });
}

export async function PATCH(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servis anahtari eksik." },
      { status: 503 }
    );
  }

  let body: OrderPatchRequest;
  try {
    body = (await request.json()) as OrderPatchRequest;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON gonderildi." }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const nextStatus = body.status?.trim().toLowerCase();

  if (!orderId) {
    return NextResponse.json({ error: "orderId gondermelisiniz." }, { status: 400 });
  }

  if (!nextStatus || !["pending", "paid", "failed", "refunded"].includes(nextStatus)) {
    return NextResponse.json({ error: "Gecerli bir status gondermelisiniz." }, { status: 400 });
  }

  const { data: target, error: selectError } = await admin
    .from("orders")
    .select("id,payment_status,payment_reference")
    .eq("id", orderId)
    .limit(1)
    .maybeSingle();

  if (selectError || !target?.id) {
    return NextResponse.json({ error: "Siparis bulunamadi." }, { status: 404 });
  }

  if (target.payment_status === nextStatus) {
    return NextResponse.json({ ok: true, message: "Siparis zaten bu durumda.", order: target });
  }

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      payment_status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", target.id)
    .select("id,payment_status,payment_reference,updated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Siparis durumu guncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Siparis durumu guncellendi.",
    order: updated,
  });
}

export async function POST(request: Request) {
  let body: OrderPatchRequest;
  try {
    body = (await request.json()) as OrderPatchRequest;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON gonderildi." }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId gondermelisiniz." }, { status: 400 });
  }

  return PATCH(
    new Request(request.url, {
      method: "PATCH",
      headers: request.headers,
      body: JSON.stringify({ orderId, status: "paid" }),
    })
  );
}
