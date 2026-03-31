import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStripeClient,
  toStripeAmount,
  toStripeCurrencyCode,
} from "@/lib/payments/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase public ortam degiskenleri eksik." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giris yapmaniz gerekiyor." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Odeme modulu icin servis anahtari eksik." },
      { status: 503 }
    );
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe SECRET key tanimli degil." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { packageId?: string; packageSlug?: string };
  if (!body.packageId && !body.packageSlug) {
    return NextResponse.json({ error: "packageId veya packageSlug zorunlu." }, { status: 400 });
  }

  let pkg: { id: string; price: number; currency: string; package_type: string } | null = null;
  let pkgError: unknown = null;

  if (body.packageId) {
    const byId = await admin
      .from("software_packages")
      .select("id,price,currency,package_type")
      .eq("id", body.packageId)
      .eq("is_active", true)
      .maybeSingle();

    pkg = byId.data;
    pkgError = byId.error;
  }

  // UI fallback data id'si ile DB id'si farkliysa slug ile ikinci deneme yap.
  if (!pkg && body.packageSlug) {
    const bySlug = await admin
      .from("software_packages")
      .select("id,price,currency,package_type")
      .eq("slug", body.packageSlug)
      .eq("is_active", true)
      .maybeSingle();

    pkg = bySlug.data;
    pkgError = bySlug.error;
  }

  if (pkgError || !pkg) {
    return NextResponse.json({ error: "Paket bulunamadi." }, { status: 404 });
  }

  if (pkg.package_type !== "paid") {
    return NextResponse.json({ error: "Demo paket icin satin alma gerekmez." }, { status: 400 });
  }

  const { data: existingPaid } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", user.id)
    .eq("package_id", pkg.id)
    .eq("payment_status", "paid")
    .maybeSingle();

  if (existingPaid?.id) {
    return NextResponse.json({ ok: true, message: "Bu paket zaten satin alinmis." });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/paketler?payment=success`,
    cancel_url: `${appUrl}/paketler?payment=cancel`,
    customer_email: user.email ?? undefined,
    metadata: {
      userId: user.id,
      packageId: pkg.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: toStripeCurrencyCode(pkg.currency),
          unit_amount: toStripeAmount(Number(pkg.price)),
          product_data: {
            name: "Yazilim Paketi",
            description: `Paket ID: ${pkg.id}`,
          },
        },
      },
    ],
  });

  if (!session.url || !session.id) {
    return NextResponse.json({ error: "Odeme oturumu olusturulamadi." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("orders").insert({
    user_id: user.id,
    package_id: pkg.id,
    amount: pkg.price,
    currency: pkg.currency,
    payment_status: "pending",
    payment_reference: session.id,
  });

  if (insertError) {
    return NextResponse.json({ error: "Talep olusturulamadi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, checkoutUrl: session.url });
}
