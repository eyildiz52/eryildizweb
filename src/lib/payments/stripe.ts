import Stripe from "stripe";

function normalizeStripeSecretKey(value: string | undefined) {
  if (!value) {
    return null;
  }

  // Vercel'e yapistirirken olusabilen satir sonu/tirnak gibi karakterleri temizle.
  const cleaned = value.replace(/[\r\n]/g, "").trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) {
    return null;
  }

  // Stripe secret key formati: sk_test_... veya sk_live_...
  if (!/^sk_(test|live)_/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

const stripeSecretKey = normalizeStripeSecretKey(process.env.STRIPE_SECRET_KEY);
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function getStripeClient() {
  if (!stripeSecretKey) {
    return null;
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
    timeout: 20_000,
    maxNetworkRetries: 2,
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
