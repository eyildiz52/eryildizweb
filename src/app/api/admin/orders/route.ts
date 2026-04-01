import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type MarkPaidRequest = {
  orderId?: string;
  paymentReference?: string;
};

function getAdminApiKey() {
  return (process.env.ADMIN_API_KEY ?? "").trim();
}

function isAuthorized(request: Request) {
  const expected = getAdminApiKey();
  if (!expected) return false;

  const given = (request.headers.get("x-admin-key") ?? "").trim();
  return given.length > 0 && given === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servis anahtari eksik." },
      { status: 503 }
    );
  }

  const { data, error } = await admin
    .from("orders")
    .select("id,user_id,package_id,amount,currency,payment_status,payment_reference,created_at")
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Bekleyen siparisler alinamadi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pendingOrders: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servis anahtari eksik." },
      { status: 503 }
    );
  }

  let body: MarkPaidRequest;
  try {
    body = (await request.json()) as MarkPaidRequest;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON gonderildi." }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const paymentReference = body.paymentReference?.trim();

  if (!orderId && !paymentReference) {
    return NextResponse.json(
      { error: "orderId veya paymentReference gondermelisiniz." },
      { status: 400 }
    );
  }

  let selectQuery = admin
    .from("orders")
    .select("id,payment_status,payment_reference")
    .eq("payment_status", "pending")
    .limit(1);

  if (orderId) {
    selectQuery = selectQuery.eq("id", orderId);
  } else {
    selectQuery = selectQuery.eq("payment_reference", paymentReference as string);
  }

  const { data: target, error: selectError } = await selectQuery.maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: "Siparis bulunamadi." }, { status: 404 });
  }

  if (!target?.id) {
    return NextResponse.json(
      { error: "Pending durumda siparis bulunamadi." },
      { status: 404 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", target.id)
    .eq("payment_status", "pending")
    .select("id,payment_status,payment_reference,updated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: "Siparis paid yapilamadi." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Siparis paid olarak guncellendi.",
    order: updated,
  });
}
