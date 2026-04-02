import type { Metadata } from "next";
import Link from "next/link";
import { AdminContentManager } from "@/components/admin-content-manager";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminPackageInput = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string | null;
  package_type: "demo" | "paid";
  price: number;
  currency: string;
  demo_url: string | null;
  is_active: boolean;
  created_at: string;
  storage_bucket?: string | null;
  storage_path?: string | null;
};

export const metadata: Metadata = {
  title: "Yonetim | ER YILDIZ YAZILIM",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await requireAdminAccess();

  if (!access.ok) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <section className="glass-card">
          <h1 className="font-heading text-3xl text-white">Yonetim Erisimi Kapali</h1>
          <p className="mt-3 text-sm text-white/75">{access.error}</p>
          <Link
            href="/giris"
            className="mt-5 inline-flex rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937]"
          >
            Giris Sayfasina Don
          </Link>
        </section>
      </main>
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <section className="glass-card">
          <h1 className="font-heading text-3xl text-white">Yonetim Hazir Degil</h1>
          <p className="mt-3 text-sm text-white/75">Servis anahtari eksik oldugu icin panel acilamadi.</p>
        </section>
      </main>
    );
  }

  const [videosRes, packagesRes, usersRes, ordersRes] = await Promise.all([
    admin
      .from("software_videos")
      .select("id,title,summary,video_url,cover_url,is_published,created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("software_packages")
      .select("id,slug,title,short_description,long_description,package_type,price,currency,storage_bucket,storage_path,demo_url,is_active,created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id,email,full_name,company_name,role,created_at,updated_at")
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("id,user_id,package_id,amount,currency,payment_status,payment_reference,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const videos = videosRes.data ?? [];
  const packages = ((packagesRes.data ?? []) as AdminPackageInput[]).map((item) => ({
    ...item,
    storage_bucket: item.storage_bucket ?? "software-files",
    storage_path: item.storage_path ?? "",
  }));
  const users = usersRes.data ?? [];
  const orders = ordersRes.data ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <AdminContentManager
        initialVideos={videos}
        initialPackages={packages}
        initialUsers={users}
        initialOrders={orders}
      />
    </main>
  );
}
