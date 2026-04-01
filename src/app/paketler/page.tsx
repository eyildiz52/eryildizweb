import type { Metadata } from "next";
import Link from "next/link";
import { OrderHistoryActions } from "@/components/order-history-actions";
import { PackageActions } from "@/components/package-actions";
import { getActivePackages } from "@/lib/platform-data";
import { getPackageMarketingContent, purchaseFlowSteps } from "@/lib/site-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Paketler | ER YILDIZ YAZILIM",
};

type PackagesPageProps = {
  searchParams: Promise<{ payment?: string }>;
};

type OrderRow = {
  package_id: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
};

function getStatusLabel(status: OrderRow["payment_status"]) {
  if (status === "pending") return "Odeme Bekleniyor";
  if (status === "paid") return "Odeme Onaylandi";
  if (status === "failed") return "Odeme Basarisiz";
  return "Iade Edildi";
}

function getStatusClass(status: OrderRow["payment_status"]) {
  if (status === "pending") return "border-amber-300/40 bg-amber-500/15 text-amber-100";
  if (status === "paid") return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
  if (status === "failed") return "border-rose-300/40 bg-rose-500/15 text-rose-100";
  return "border-slate-300/40 bg-slate-500/15 text-slate-100";
}

function getDownloadLabel(status: OrderRow["payment_status"]) {
  if (status === "paid") {
    return "Indirme: Aktif";
  }

  if (status === "pending") {
    return "Indirme: Odeme onayi bekleniyor";
  }

  if (status === "failed") {
    return "Indirme: Odeme basarisiz";
  }

  return "Indirme: Iade sonrasi kapali";
}

function formatPrice(price: number, currency: string) {
  if (!price) {
    return "Ucretsiz";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const { payment } = await searchParams;

  const [packages, supabase] = await Promise.all([
    getActivePackages(),
    getSupabaseServerClient(),
  ]);

  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  let recentOrders: OrderRow[] = [];
  let packageOrderStatusMap = new Map<string, OrderRow["payment_status"]>();
  if (supabase && user) {
    const { data } = await supabase
      .from("orders")
      .select("package_id,payment_status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const allOrders = (data ?? []) as OrderRow[];
    recentOrders = allOrders.slice(0, 5);

    // Desc sirali listede ilk kayit paketin en guncel siparis durumudur.
    packageOrderStatusMap = new Map(
      allOrders
        .filter((order, index, arr) => arr.findIndex((item) => item.package_id === order.package_id) === index)
        .map((order) => [order.package_id, order.payment_status])
    );
  }

  const packageTitleById = new Map(packages.map((item) => [item.id, item.title]));
  const packageById = new Map(packages.map((item) => [item.id, item]));
  const paidPackages = packages.filter((item) => item.package_type === "paid");
  const demoPackages = packages.filter((item) => item.package_type === "demo");

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <section className="mb-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.16em] text-white/65">PAKETLER</p>
          <h1 className="mt-2 font-heading text-4xl text-white md:text-5xl">Satin al, dene, onayla ve kontrollu sekilde teslim et</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 md:text-base">
            Paketler sayfasi artik sadece fiyat listesi degil. Her urunun kime hitap ettigini, ne is gordugunu ve satin alma sonrasi nasil teslim edildigini net gosteren bir satis vitrini olarak duzenlendi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demolar"
              className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white"
            >
              Demo Paketleri Gor
            </Link>
            <Link
              href="/videolar"
              className="rounded-full border border-[#f8b84e]/25 bg-[#f8b84e]/10 px-5 py-3 text-sm font-semibold text-[#ffe0a5]"
            >
              Urun Videolarini Incele
            </Link>
          </div>
        </div>

        <div className="feature-panel grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/12 bg-white/6 p-4">
            <p className="text-xs text-white/55">Ucretli Paket</p>
            <p className="mt-2 font-heading text-3xl text-white">{paidPackages.length}</p>
            <p className="mt-2 text-xs leading-6 text-white/70">Odeme onayi ile teslim edilen aktif urun</p>
          </article>
          <article className="rounded-2xl border border-white/12 bg-white/6 p-4">
            <p className="text-xs text-white/55">Demo</p>
            <p className="mt-2 font-heading text-3xl text-white">{demoPackages.length}</p>
            <p className="mt-2 text-xs leading-6 text-white/70">Satin alma oncesi deneme alani</p>
          </article>
          <article className="rounded-2xl border border-white/12 bg-white/6 p-4">
            <p className="text-xs text-white/55">Teslimat</p>
            <p className="mt-2 font-heading text-3xl text-white">Kontrollu</p>
            <p className="mt-2 text-xs leading-6 text-white/70">Paid olmadan indirme acilmaz</p>
          </article>
        </div>
      </section>

      {payment === "success" ? (
        <div className="mb-6 rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-5 py-4 text-sm text-emerald-100">
          Odeme oturumunuz basariyla tamamlandi. Webhook sonrasi paket indirme izniniz aktif olur.
        </div>
      ) : null}
      {payment === "cancel" ? (
        <div className="mb-6 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-5 py-4 text-sm text-amber-100">
          Odeme islemi iptal edildi. Dilerseniz satin alma adimini tekrar baslatabilirsiniz.
        </div>
      ) : null}
      {payment === "pending" ? (
        <div className="mb-6 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-5 py-4 text-sm text-amber-100">
          Havale/EFT talebiniz olusturuldu. Aciklama kodu ile odemeyi tamamlayinca paketiniz onaylanacaktir.
        </div>
      ) : null}

      {user ? (
        <section className="mb-6 glass-card p-4">
          <h2 className="font-heading text-xl text-white">Son Siparis Durumu</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-white/75">Henuz siparis olusturmadiniz.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {recentOrders.map((order, index) => {
                const relatedPackage = packageById.get(order.package_id);

                return (
                  <article
                    key={`${order.package_id}-${order.created_at}-${index}`}
                    className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85"
                  >
                    <p className="font-medium text-white">
                      {packageTitleById.get(order.package_id) ?? order.package_id}
                    </p>
                    <p className="text-xs text-white/70">
                      Durum: {getStatusLabel(order.payment_status)} | {new Date(order.created_at).toLocaleString("tr-TR")}
                    </p>
                    <p className="mt-1 text-xs text-white/70">{getDownloadLabel(order.payment_status)}</p>
                    <OrderHistoryActions
                      packageSlug={relatedPackage?.slug}
                      canDownload={order.payment_status === "paid"}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <section className="mb-8">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-white/65">SATIN ALMA AKISI</p>
            <h2 className="mt-2 font-heading text-3xl text-white">Karar vermeyi kolaylastiran net ilerleme</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/74">
            Kullaniciya once deger onerisi, sonra odeme mantigi, sonra teslimat sekli gosterilir. Paket kartlari bu mantiga gore guncellendi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {purchaseFlowSteps.map((item) => (
            <article key={item.step} className="glass-card p-4">
              <p className="text-sm font-semibold text-[#ffd98a]">{item.step}</p>
              <p className="mt-2 font-heading text-lg text-white">{item.title}</p>
              <p className="mt-1 text-xs leading-6 text-white/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-[28px] border border-white/12 bg-white/6 px-5 py-5 backdrop-blur-md">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Odeme Kontrolu", text: "Paid olmayan sipariste ucretli indirme acilmaz; teslimat siparis durumuna baglidir." },
            { title: "Demo Stratejisi", text: "Ziyaretci once demosunu gorur, sonra ihtiyacina gore ucretli pakete gecer." },
            { title: "Satis Sonrasi", text: "Uye alani ve siparis gecmisi ile satin alma sonrasi surec kaybolmaz." },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-[#08111f]/65 p-4">
              <p className="font-heading text-lg text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-white/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {packages.map((item) => {
          const marketing = getPackageMarketingContent(item.slug, item.title);

          return (
            <article key={item.id} id={`pkg-${item.slug}`} className="feature-panel scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-full border border-[#f8b84e]/25 bg-[#f8b84e]/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#ffe0a5]">
                    {marketing.badge}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/65">
                    {item.package_type === "paid" ? "Ucretli Paket" : "Demo Paket"}
                  </p>
                </div>
                {packageOrderStatusMap.get(item.id) ? (
                  <span
                    className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusClass(
                      packageOrderStatusMap.get(item.id) as OrderRow["payment_status"]
                    )}`}
                  >
                    {getStatusLabel(packageOrderStatusMap.get(item.id) as OrderRow["payment_status"])}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-heading text-3xl text-white">{item.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-white/78">{marketing.valueLine}</p>
                </div>
                <p className="text-2xl font-semibold text-[#ffd98a]">{formatPrice(item.price, item.currency)}</p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs tracking-[0.14em] text-white/55">IDEAL KULLANIM</p>
                  <p className="mt-2 text-sm leading-7 text-white/78">{marketing.idealFor}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs tracking-[0.14em] text-white/55">PAKET OZETI</p>
                  <p className="mt-2 text-sm leading-7 text-white/78">{item.short_description}</p>
                  {item.long_description ? (
                    <p className="mt-2 text-sm leading-7 text-white/68">{item.long_description}</p>
                  ) : null}
                </div>
              </div>

              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {marketing.highlights.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-2xl border border-white/10 bg-[#08111f]/65 px-4 py-3 text-sm text-white/82"
                  >
                    {feature}
                  </li>
                ))}
              </ul>

              <PackageActions
                item={item}
                hasUser={Boolean(user)}
                paymentStatus={packageOrderStatusMap.get(item.id)}
              />
            </article>
          );
        })}
      </section>
    </main>
  );
}
