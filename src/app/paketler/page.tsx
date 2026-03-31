import type { Metadata } from "next";
import { OrderHistoryActions } from "@/components/order-history-actions";
import { PackageActions } from "@/components/package-actions";
import { getActivePackages } from "@/lib/platform-data";
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

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="mb-8">
        <p className="text-xs tracking-[0.16em] text-white/65">PAKETLER</p>
        <h1 className="font-heading text-4xl text-white">Satin Al, Kur, Buyut</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
          Ucretli paketler odeme onayi sonrasi indirilebilir. Demo paketler aninda indirilebilir.
        </p>
      </div>

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

      {user ? (
        <section className="mb-6 glass-card p-4">
          <h2 className="font-heading text-xl text-white">Son Siparis Durumu</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-2 text-sm text-white/75">Henuz siparis olusturmadiniz.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {recentOrders.map((order, index) => (
                (() => {
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
                })()
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          { title: "Odeme Kontrolu", text: "Paid olmayan sipariste indirme acilmaz." },
          { title: "Demo Stratejisi", text: "Urunu denet, sonra ucretli pakete gec." },
          { title: "Satis Sonrasi", text: "Uye mesajlasmasi ile destek akisini guclendir." },
        ].map((item) => (
          <article key={item.title} className="glass-card p-4">
            <p className="font-heading text-lg text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-6 text-white/75">{item.text}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        {packages.map((item) => (
          <article key={item.id} id={`pkg-${item.slug}`} className="glass-card scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs uppercase tracking-[0.16em] text-white/65">
                {item.package_type === "paid" ? "Ucretli Paket" : "Demo Paket"}
              </p>
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
            <h2 className="mt-2 font-heading text-3xl text-white">{item.title}</h2>
            <p className="mt-3 text-sm text-white/85">{item.short_description}</p>
            <p className="mt-3 text-sm text-white/70">{item.long_description}</p>
            <p className="mt-4 text-lg font-semibold text-[#ffd98a]">
              {item.package_type === "paid" ? `${item.price} ${item.currency}` : "Ucretsiz"}
            </p>
            <PackageActions
              item={item}
              hasUser={Boolean(user)}
              paymentStatus={packageOrderStatusMap.get(item.id)}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
