import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PackagePatchPayload = {
  id?: string;
  title?: string;
  shortDescription?: string;
  longDescription?: string | null;
  price?: number;
  currency?: string;
  demoUrl?: string | null;
  isActive?: boolean;
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalUrl(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("software_packages")
    .select("id,slug,title,short_description,long_description,package_type,price,currency,demo_url,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Paketler getirilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, packages: data ?? [] });
}

export async function PATCH(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: PackagePatchPayload;
  try {
    payload = (await request.json()) as PackagePatchPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const id = cleanText(payload.id);
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const updates: {
    title?: string;
    short_description?: string;
    long_description?: string | null;
    price?: number;
    currency?: string;
    demo_url?: string | null;
    is_active?: boolean;
  } = {};

  if (payload.title !== undefined) {
    const title = cleanText(payload.title);
    if (!title) {
      return NextResponse.json({ error: "title bos olamaz." }, { status: 400 });
    }
    updates.title = title;
  }

  if (payload.shortDescription !== undefined) {
    const shortDescription = cleanText(payload.shortDescription);
    if (!shortDescription) {
      return NextResponse.json({ error: "shortDescription bos olamaz." }, { status: 400 });
    }
    updates.short_description = shortDescription;
  }

  if (payload.longDescription !== undefined) {
    updates.long_description = cleanText(payload.longDescription);
  }

  if (payload.price !== undefined) {
    const price = Number(payload.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "price 0 veya daha buyuk olmali." }, { status: 400 });
    }
    updates.price = price;
  }

  if (payload.currency !== undefined) {
    const currency = cleanText(payload.currency);
    if (!currency) {
      return NextResponse.json({ error: "currency bos olamaz." }, { status: 400 });
    }
    updates.currency = currency.toUpperCase();
  }

  if (payload.demoUrl !== undefined) {
    updates.demo_url = cleanOptionalUrl(payload.demoUrl);
  }

  if (payload.isActive !== undefined) {
    updates.is_active = payload.isActive === true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Guncelleme alani yok." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("software_packages")
    .update(updates)
    .eq("id", id)
    .select("id,slug,title,short_description,long_description,package_type,price,currency,demo_url,is_active,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Paket guncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, package: data });
}
