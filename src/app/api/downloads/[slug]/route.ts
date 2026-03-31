import { NextResponse } from "next/server";
import { getPackageBySlug, hasPaidAccess } from "@/lib/platform-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

    const allowed = await hasPaidAccess(user.id, softwarePackage.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Bu paketi indirmek icin odeme onayi gerekli." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await admin.storage
    .from(softwarePackage.storage_bucket)
    .createSignedUrl(softwarePackage.storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Dosya linki olusturulamadi. Storage path kontrol edin." },
      { status: 500 }
    );
  }

  if (user) {
    await admin.from("downloads").insert({
      user_id: user.id,
      package_id: softwarePackage.id,
    });
  }

  return NextResponse.json({ downloadUrl: data.signedUrl });
}
