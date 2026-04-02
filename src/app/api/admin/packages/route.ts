import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PackagePatchPayload = {
  id?: string;
  packageType?: "demo" | "paid";
  title?: string;
  shortDescription?: string;
  longDescription?: string | null;
  price?: number;
  currency?: string;
  demoUrl?: string | null;
  storageBucket?: string;
  storagePath?: string;
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
    .select("id,slug,title,short_description,long_description,package_type,price,currency,storage_bucket,storage_path,demo_url,is_active,created_at")
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
    package_type?: "demo" | "paid";
    title?: string;
    short_description?: string;
    long_description?: string | null;
    price?: number;
    currency?: string;
    storage_bucket?: string;
    storage_path?: string;
    demo_url?: string | null;
    is_active?: boolean;
  } = {};

  if (payload.packageType !== undefined) {
    if (payload.packageType !== "demo" && payload.packageType !== "paid") {
      return NextResponse.json({ error: "packageType demo veya paid olmali." }, { status: 400 });
    }

    updates.package_type = payload.packageType;
  }

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

  if (payload.storageBucket !== undefined) {
    const storageBucket = cleanText(payload.storageBucket);
    if (!storageBucket) {
      return NextResponse.json({ error: "storageBucket bos olamaz." }, { status: 400 });
    }
    updates.storage_bucket = storageBucket;
  }

  if (payload.storagePath !== undefined) {
    const storagePath = cleanText(payload.storagePath);
    if (!storagePath) {
      return NextResponse.json({ error: "storagePath bos olamaz." }, { status: 400 });
    }
    updates.storage_path = storagePath.replace(/^\/+/, "");
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
    .select("id,slug,title,short_description,long_description,package_type,price,currency,storage_bucket,storage_path,demo_url,is_active,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `Paket guncellenemedi. ${error.message}` },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Paket bulunamadi veya guncellenemedi." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, package: data });
}

export async function POST(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: {
    slug?: string;
    packageType?: "demo" | "paid";
    title?: string;
    shortDescription?: string;
    longDescription?: string | null;
    price?: number;
    currency?: string;
    storageBucket?: string;
    storagePath?: string;
    demoUrl?: string | null;
    isActive?: boolean;
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const slug = cleanText(payload.slug);
  if (!slug) {
    return NextResponse.json({ error: "slug zorunludur." }, { status: 400 });
  }

  const title = cleanText(payload.title);
  if (!title) {
    return NextResponse.json({ error: "title zorunludur." }, { status: 400 });
  }

  const shortDescription = cleanText(payload.shortDescription);
  if (!shortDescription) {
    return NextResponse.json({ error: "shortDescription zorunludur." }, { status: 400 });
  }

  const packageType = payload.packageType === "paid" ? "paid" : "demo";
  const price = Number(payload.price) || 0;
  const currency = cleanText(payload.currency) || "TRY";
  const storageBucket = cleanText(payload.storageBucket) || "software-files";
  const storagePath = cleanText(payload.storagePath) || "";
  const isActive = payload.isActive !== false;

  const { data, error } = await admin
    .from("software_packages")
    .insert([
      {
        slug,
        title,
        short_description: shortDescription,
        long_description: cleanText(payload.longDescription) || null,
        package_type: packageType,
        price,
        currency: currency.toUpperCase(),
        storage_bucket: storageBucket,
        storage_path: storagePath ? storagePath.replace(/^\/+/, "") : "",
        demo_url: cleanOptionalUrl(payload.demoUrl),
        is_active: isActive,
      },
    ])
    .select("id,slug,title,short_description,long_description,package_type,price,currency,storage_bucket,storage_path,demo_url,is_active,created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Paket olusturulamadi. ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, package: data });
}

export async function DELETE(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: { id?: string };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const id = cleanText(payload.id);
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const { error: deleteError } = await admin
    .from("software_packages")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `Paket silinemedi. ${deleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
