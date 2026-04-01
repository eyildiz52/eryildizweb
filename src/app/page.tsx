import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { getActivePackages, getPublishedVideos } from "@/lib/platform-data";
import {
  getPackageMarketingContent,
  homepageFaq,
  homepageProofPoints,
  purchaseFlowSteps,
  trustHighlights,
} from "@/lib/site-content";

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

export default async function Home() {
  const [packages, videos] = await Promise.all([getActivePackages(), getPublishedVideos()]);
  const highlightedPackages = packages.slice(0, 3);
  const highlightedVideos = videos.slice(0, 2);
  const paidPackages = packages.filter((item) => item.package_type === "paid");
  const demoPackages = packages.filter((item) => item.package_type === "demo");

  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-grid" aria-hidden="true" />
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-16 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div className="space-y-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#f8b84e]/30 bg-[#f8b84e]/10 px-4 py-2 text-xs tracking-[0.2em] text-[#ffe0a5]">
              ER YILDIZ YAZILIM | SATISA HAZIR URUN VITRINI
            </div>
            <h1 className="max-w-4xl font-heading text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              Yazilim paketlerini guven veren bir arayuzle sun, odemeyi topla, teslimati kontrollu yonet.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              CRM, stok ve on muhasebe odakli urunlerini tek platformda tanit. Demo, video,
              uyelik ve kontrollu indirme akisiyla ziyaretciyi satin alma kararina daha hizli tasi.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-white/78">
              <span className="rounded-full border border-white/15 bg-white/6 px-4 py-2">Manuel odeme aktif</span>
              <span className="rounded-full border border-white/15 bg-white/6 px-4 py-2">Supabase tabanli teslimat</span>
              <span className="rounded-full border border-white/15 bg-white/6 px-4 py-2">Demo ve video destekli satis</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/paketler"
                className="rounded-full bg-[#ffd166] px-7 py-3 text-center text-sm font-semibold tracking-wide text-[#1f2937] transition hover:-translate-y-0.5"
              >
                Paketleri Incele
              </Link>
              <Link
                href="/demolar"
                className="rounded-full border border-white/35 bg-white/10 px-7 py-3 text-center text-sm font-semibold tracking-wide text-white transition hover:bg-white/20"
              >
                Demolari Incele
              </Link>
              <Link
                href="#iletisim"
                className="rounded-full border border-[#f8b84e]/30 bg-[#f8b84e]/12 px-7 py-3 text-center text-sm font-semibold tracking-wide text-[#ffe0a5] transition hover:bg-[#f8b84e]/18"
              >
                Teklif Isteyin
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="feature-panel space-y-4">
              <div>
                <p className="text-xs tracking-[0.16em] text-[#ffe0a5]/80">OPERASYON OZETI</p>
                <p className="mt-2 font-heading text-3xl text-white">Satisa hazir dijital urun akisi</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-white/12 bg-white/6 p-4">
                  <p className="text-xs text-white/55">Ucretli Paket</p>
                  <p className="mt-1 font-heading text-2xl text-white">{paidPackages.length}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">Odeme onayi sonrasi erisim acilan aktif satis urunleri</p>
                </article>
                <article className="rounded-2xl border border-white/12 bg-white/6 p-4">
                  <p className="text-xs text-white/55">Demo Paketi</p>
                  <p className="mt-1 font-heading text-2xl text-white">{demoPackages.length}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">Satin alma oncesi deneme ve talep olusturma akisi</p>
                </article>
                <article className="rounded-2xl border border-white/12 bg-white/6 p-4 sm:col-span-2">
                  <p className="text-xs text-white/55">Yayinlanan Video</p>
                  <p className="mt-1 font-heading text-2xl text-white">{videos.length}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">Urunu gosteren video vitrini ile guven olusturan tanitim alani</p>
                </article>
              </div>
            </div>

            <article className="glass-card p-5">
              <p className="text-xs tracking-[0.16em] text-white/60">BUGUN KULLANILAN AKIS</p>
              <ul className="mt-3 space-y-3 text-sm leading-7 text-white/82">
                {trustHighlights.slice(0, 3).map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-[#ffd166]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section id="hizmetler" className="mx-auto grid w-full max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3 md:px-10">
        {homepageProofPoints.map((item) => (
          <article key={item.title} className="glass-card min-h-[220px]">
            <h2 className="font-heading text-2xl text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-white/65">ONE CIKAN PAKETLER</p>
            <h2 className="mt-2 font-heading text-3xl text-white">Gercek urunler, net kullanim senaryolari</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/72">
            Kategoriyi, hedef kullanim alanini ve deger onerisini daha ilk bakista anlatan bir vitrin,
            satis sayfasini sadece liste olmaktan cikarir.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {highlightedPackages.map((item) => {
            const content = getPackageMarketingContent(item.slug, item.title);

            return (
              <article key={item.id} className="feature-panel flex h-full flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#f8b84e]/25 bg-[#f8b84e]/10 px-3 py-1 text-xs tracking-[0.14em] text-[#ffe0a5]">
                    {content.badge}
                  </span>
                  <span className="text-sm font-semibold text-[#ffd98a]">{formatPrice(item.price, item.currency)}</span>
                </div>
                <div>
                  <h3 className="font-heading text-3xl text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">{content.valueLine}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/72">
                  <p className="text-xs tracking-[0.14em] text-white/52">IDEAL KULLANIM</p>
                  <p className="mt-2 leading-7">{content.idealFor}</p>
                </div>
                <ul className="space-y-3 text-sm text-white/82">
                  {content.highlights.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#ffd166]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-3">
                  <Link
                    href={`/paketler#pkg-${item.slug}`}
                    className="rounded-full bg-[#ffd166] px-5 py-3 text-sm font-semibold text-[#1f2937]"
                  >
                    Detaylari Gor
                  </Link>
                  {item.package_type === "demo" ? (
                    <Link
                      href="/demolar"
                      className="rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Demo Alanina Git
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-white/65">NASIL CALISIR</p>
            <h2 className="mt-2 font-heading text-3xl text-white">Ziyaretciyi karar anina tasiyan net akis</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/72">
            Uc adimlik net akista kullanici once urunu anlar, sonra odemeyi baslatir, son olarak kontrollu teslimatla pakete ulasir.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {purchaseFlowSteps.map((item) => (
            <article key={item.step} className="glass-card min-h-[220px]">
              <p className="text-sm font-semibold text-[#ffd98a]">{item.step}</p>
              <h3 className="mt-4 font-heading text-2xl text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/80">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="feature-panel">
            <p className="text-xs tracking-[0.16em] text-[#ffe0a5]/75">GUVEN KATMANI</p>
            <h2 className="mt-3 font-heading text-3xl text-white">Sadece guzel gorunen degil, kontrol eden arayuz</h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/80">
              {trustHighlights.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  {item}
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            {highlightedVideos.length === 0 ? (
              <article className="glass-card md:col-span-2">
                <h3 className="font-heading text-2xl text-white">Henuz video eklenmedi</h3>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  Video vitrini yayina alindiginda ana sayfada urun guvenini destekleyen alan burada dolacak.
                </p>
              </article>
            ) : (
              highlightedVideos.map((video) => (
                <article key={video.id} className="glass-card">
                  <p className="text-xs tracking-[0.16em] text-white/60">VIDEO VITRINI</p>
                  <h3 className="mt-3 font-heading text-2xl text-white">{video.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/78">{video.summary}</p>
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Videoyu Ac
                  </a>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-10">
        <div className="mb-6">
          <p className="text-xs tracking-[0.16em] text-white/65">SIK SORULANLAR</p>
          <h2 className="mt-2 font-heading text-3xl text-white">Ziyaretcinin cevabi hazir sorulari</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {homepageFaq.map((item) => (
            <article key={item.question} className="glass-card min-h-[220px]">
              <h3 className="font-heading text-2xl text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-white/78">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="iletisim" className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="feature-panel mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-[#ffe0a5]/75">BASLANGIC</p>
            <h3 className="mt-2 font-heading text-3xl text-white">Projenizi birlikte yayina alalim</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/80">
              Gercek paketlerinizi, demo akisinizi ve satis vitrininizi birlikte netlestirelim. Teklif,
              uyelik ve teslimat yapisini bu platform uzerinden kurumsal gorunume tasiyin.
            </p>
          </div>
          <Link
            href="/giris"
            className="rounded-full bg-white px-7 py-3 text-center text-sm font-semibold text-[#0f172a]"
          >
            Uyelige Gec
          </Link>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
