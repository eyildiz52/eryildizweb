import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function getStripeClient() {
  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export function getStripeWebhookSecret() {
  return stripeWebhookSecret ?? null;
}

export function toStripeCurrencyCode(currency: string) {
  return currency.toLowerCase();
}

export function toStripeAmount(amount: number) {
  return Math.round(amount * 100);
}
