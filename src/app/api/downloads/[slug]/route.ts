import { NextResponse } from "next/server";
import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getPackageBySlug, hasPaidAccess } from "@/lib/platform-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminAccess } from "@/lib/admin-access";

const STORAGE_PROVIDER = (process.env.OBJECT_STORAGE_PROVIDER ?? "supabase").toLowerCase();

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const softwarePackage = await getPackageBySlug(slug);

  if (!softwarePackage) {
    return NextResponse.json({ error: "Paket bulunamadi." }, { status: 404 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Indirme servisi icin servis anahtari eksik." },
      { status: 503 }
    );
  }

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

  if (softwarePackage.package_type === "paid") {
    if (!user) {
      return NextResponse.json(
        { error: "Ucretli paketleri indirmek icin giris yapin." },
        { status: 401 }
      );
    }

    const adminAccess = await requireAdminAccess();
    const isAdmin = adminAccess.ok;

    if (!isAdmin) {
      const allowed = await hasPaidAccess(user.id, softwarePackage.id);
      if (!allowed) {
        return NextResponse.json(
          { error: "Bu paketi indirmek icin odeme onayi gerekli." },
          { status: 403 }
        );
      }
    }
  }

  let downloadUrl: string | null = null;

  if (STORAGE_PROVIDER === "r2") {
    const r2Client = getR2Client();
    const r2Bucket = process.env.R2_BUCKET || softwarePackage.storage_bucket;

    if (!r2Client || !r2Bucket) {
      return NextResponse.json({ error: "R2 ayarlari eksik." }, { status: 503 });
    }

    try {
      await r2Client.send(
        new HeadObjectCommand({
          Bucket: r2Bucket,
          Key: softwarePackage.storage_path,
        })
      );

      downloadUrl = await getSignedUrl(
        r2Client,
        new GetObjectCommand({
          Bucket: r2Bucket,
          Key: softwarePackage.storage_path,
        }),
        { expiresIn: 60 * 10 }
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: "R2 dosyasi bulunamadi veya indirme linki olusturulamadi.",
          detail: error instanceof Error ? error.message : "Bilinmeyen hata",
        },
        { status: 500 }
      );
    }
  } else {
    const { data, error } = await admin.storage
      .from(softwarePackage.storage_bucket)
      .createSignedUrl(softwarePackage.storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      const errorDetail =
        error?.message ??
        `Bucket: ${softwarePackage.storage_bucket}, Path: ${softwarePackage.storage_path}`;

      return NextResponse.json(
        {
          error:
            "Dosya linki olusturulamadi. Muhtemelen dosya Storage'a yuklenmedi veya yol hatali.",
          detail: errorDetail,
        },
        { status: 500 }
      );
    }

    downloadUrl = data.signedUrl;
  }

  if (user) {
    await admin.from("downloads").insert({
      user_id: user.id,
      package_id: softwarePackage.id,
    });
  }

  return NextResponse.json({ downloadUrl });
}
