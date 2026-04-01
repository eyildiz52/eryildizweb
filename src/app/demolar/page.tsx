import type { Metadata } from "next";
import Link from "next/link";
import { PackageActions } from "@/components/package-actions";
import { getDemoPackages } from "@/lib/platform-data";
import { demosPageHighlights, getPackageMarketingContent } from "@/lib/site-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Demolar | ER YILDIZ YAZILIM",
};

export default async function DemosPage() {
  const [demoPackages, supabase] = await Promise.all([
    getDemoPackages(),
    getSupabaseServerClient(),
  ]);

  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.16em] text-white/65">DEMOLAR</p>
          <h1 className="mt-2 font-heading text-4xl text-white md:text-5xl">Aninda indirilebilir demo alani ile satin alma oncesi guven olusturun</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 md:text-base">
            Demo sayfasi, ziyaretciye sadece bilgi vermek yerine urunun hissini gosteren alan olmalidir. Bu bolumde kullanici once demo indirir, sonra ucretli pakete gecmeye daha hazir hale gelir.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/paketler"
              className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white"
            >
              Ucretli Paketleri Gor
            </Link>
            <Link
              href="/videolar"
              className="rounded-full border border-[#f8b84e]/25 bg-[#f8b84e]/10 px-5 py-3 text-sm font-semibold text-[#ffe0a5]"
            >
              Video Vitrinine Git
            </Link>
          </div>
        </div>

        <div className="feature-panel">
          <p className="text-xs tracking-[0.16em] text-[#ffe0a5]/75">DEMO STRATEJISI</p>
          <div className="mt-4 space-y-3">
            {demosPageHighlights.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {demoPackages.length === 0 ? (
          <article className="glass-card md:col-span-2">
            <h2 className="font-heading text-2xl text-white">Henuz demo eklenmedi</h2>
            <p className="mt-2 text-sm text-white/75">Panelden yeni bir demo paket ekleyebilirsiniz.</p>
          </article>
        ) : (
          demoPackages.map((item) => {
            const marketing = getPackageMarketingContent(item.slug, item.title);

            return (
              <article key={item.id} className="feature-panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="rounded-full border border-[#f8b84e]/25 bg-[#f8b84e]/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#ffe0a5]">
                    {marketing.badge}
                  </p>
                  <span className="text-sm font-semibold text-[#ffd98a]">Ucretsiz Demo</span>
                </div>

                <h2 className="mt-4 font-heading text-3xl text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/82">{marketing.valueLine}</p>

                <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs tracking-[0.14em] text-white/55">KIMLER ICIN</p>
                    <p className="mt-2 text-sm leading-7 text-white/78">{marketing.idealFor}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs tracking-[0.14em] text-white/55">DEMO OZETI</p>
                    <p className="mt-2 text-sm leading-7 text-white/78">{item.short_description}</p>
                    {item.long_description ? (
                      <p className="mt-2 text-sm leading-7 text-white/68">{item.long_description}</p>
                    ) : null}
                  </div>
                </div>

                <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                  {marketing.highlights.map((feature) => (
                    <li key={feature} className="rounded-2xl border border-white/10 bg-[#08111f]/65 px-4 py-3 text-sm text-white/82">
                      {feature}
                    </li>
                  ))}
                </ul>

                <PackageActions item={item} hasUser={Boolean(user)} />
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
