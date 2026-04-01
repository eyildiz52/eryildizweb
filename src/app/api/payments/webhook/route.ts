import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = getStripeWebhookSecret();
  const admin = getSupabaseAdminClient();

  if (!stripe || !webhookSecret || !admin) {
    return NextResponse.json({ error: "Webhook servis ayarlari eksik." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Stripe imzasi yok." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook imzasi gecersiz." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    const { error } = await admin
      .from("orders")
      .update({ payment_status: "paid", updated_at: new Date().toISOString() })
      .eq("payment_reference", sessionId)
      .eq("payment_status", "pending");

    if (error) {
      return NextResponse.json({ error: "Odeme kaydi guncellenemedi." }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;

    await admin
      .from("orders")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("payment_reference", session.id)
      .eq("payment_status", "pending");
  }

  return NextResponse.json({ received: true });
}
