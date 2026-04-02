import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type SignedUploadPayload = {
  packageId?: string;
  packageType?: "demo" | "paid";
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  suggestedPath?: string;
};

type DeletePackageFilePayload = {
  packageId?: string;
};

const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024;

function normalizeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase() ?? "zip";
  return extension ? extension.replace(/[^a-z0-9]/g, "") || "zip" : "zip";
}

function normalizeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const safe = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safe || "paket";
}

function buildPackageStoragePath(packageId: string, packageType: "demo" | "paid", fileName: string) {
  const extension = normalizeExtension(fileName);
  const baseName = normalizeBaseName(fileName);
  const folder = packageType === "demo" ? "demo" : "paid";
  return `${folder}/${packageId}/${baseName}.${extension}`;
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

  let payload: SignedUploadPayload;
  try {
    payload = (await request.json()) as SignedUploadPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const packageId = typeof payload.packageId === "string" ? payload.packageId.trim() : "";
  const packageType = payload.packageType === "paid" ? "paid" : "demo";
  const fileName = typeof payload.fileName === "string" ? payload.fileName.trim() : "";
  const fileSize = Number(payload.fileSize ?? 0);
  const suggestedPath = typeof payload.suggestedPath === "string" ? payload.suggestedPath.trim() : "";

  if (!packageId) {
    return NextResponse.json({ error: "packageId zorunludur." }, { status: 400 });
  }

  if (!fileName) {
    return NextResponse.json({ error: "Dosya adi zorunludur." }, { status: 400 });
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ error: "Dosya boyutu gecersiz." }, { status: 400 });
  }

  if (fileSize > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Dosya boyutu 1 GB sinirini asiyor." }, { status: 400 });
  }

  const { data: softwarePackage, error: packageError } = await admin
    .from("software_packages")
    .select("id,slug,package_type,storage_bucket")
    .eq("id", packageId)
    .maybeSingle();

  if (packageError || !softwarePackage) {
    return NextResponse.json({ error: "Paket bulunamadi." }, { status: 404 });
  }

  const bucket = softwarePackage.storage_bucket || "software-files";
  const path = suggestedPath || buildPackageStoragePath(softwarePackage.id, packageType, fileName);

  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(path);

  if (error || !data?.token) {
    return NextResponse.json({ error: error?.message ?? "Upload izni olusturulamadi." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    provider: "supabase",
    bucket,
    path,
    token: data.token,
  });
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

  let payload: DeletePackageFilePayload;
  try {
    payload = (await request.json()) as DeletePackageFilePayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const packageId = typeof payload.packageId === "string" ? payload.packageId.trim() : "";

  if (!packageId) {
    return NextResponse.json({ error: "packageId zorunludur." }, { status: 400 });
  }

  const { data: softwarePackage, error: packageError } = await admin
    .from("software_packages")
    .select("id,storage_bucket,storage_path")
    .eq("id", packageId)
    .maybeSingle();

  if (packageError || !softwarePackage) {
    return NextResponse.json({ error: "Paket bulunamadi." }, { status: 404 });
  }

  const bucket = softwarePackage.storage_bucket?.trim();
  const path = softwarePackage.storage_path?.trim();

  if (!bucket || !path) {
    return NextResponse.json({ error: "Silinecek storage yolu bulunamadi." }, { status: 400 });
  }

  const { error } = await admin.storage.from(bucket).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message || "Dosya silinemedi." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("software_packages")
    .update({
      storage_path: "",
    })
    .eq("id", packageId);

  if (updateError) {
    return NextResponse.json(
      { error: `Storage yolu temizlenemedi. ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, bucket, path });
}