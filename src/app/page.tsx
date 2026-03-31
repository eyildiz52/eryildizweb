import Link from "next/link";
import { ContactForm } from "@/components/contact-form";

export default function Home() {
  return (
    <main className="relative isolate overflow-hidden">
      <div className="hero-grid" aria-hidden="true" />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pb-16 pt-20 md:px-10 md:pt-28">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs tracking-[0.2em] text-white/80">
          KURUMSAL YAZILIM PLATFORMU
        </div>

        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="space-y-6">
            <h1 className="font-heading text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
              Yazilim paketlerini sat, demolari dagit, videolarla markani buyut.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              Uye kaydi, ucretli paketlerde odeme zorunlulugu, demo indirmeleri, tanitim video
              galerisi ve uye mesajlasmasi tek platformda.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/paketler"
                className="rounded-full bg-[#ffd166] px-7 py-3 text-center text-sm font-semibold tracking-wide text-[#1f2937] transition hover:-translate-y-0.5"
              >
                Paketlere Git
              </Link>
              <Link
                href="/demolar"
                className="rounded-full border border-white/35 bg-white/10 px-7 py-3 text-center text-sm font-semibold tracking-wide text-white transition hover:bg-white/20"
              >
                Demolari Incele
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card space-y-3">
              <p className="text-xs tracking-[0.16em] text-white/65">HIZLI BILGI</p>
              <p className="font-heading text-3xl text-white">Satisa Hazir Altyapi</p>
              <p className="text-sm leading-7 text-white/80">
                Uye girisi, paket modulu, indirme kontrolu, video tanitim ve mesajlasma yapisi
                tek panelde.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Aktif Moduller", value: "6+" },
                { label: "Demo Dagitimi", value: "Sinirsiz" },
                { label: "Uyelik", value: "Supabase Auth" },
                { label: "Satinalma", value: "Kontrollu" },
              ].map((metric) => (
                <article key={metric.label} className="glass-card p-4">
                  <p className="text-xs text-white/60">{metric.label}</p>
                  <p className="mt-1 font-heading text-xl text-white">{metric.value}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="hizmetler" className="mx-auto grid w-full max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3 md:px-10">
        {[
          {
            title: "Yazilim Paket Satisi",
            text: "Ucretli paketlerde odeme onayi olmadan indirme acilmaz.",
          },
          {
            title: "Demo Merkezi",
            text: "Demolar ucretsiz ve hizli sekilde indirilebilir.",
          },
          {
            title: "Video ve Mesajlasma",
            text: "Kendi tanitim videolarini yayinla, uyelerle iletisim kur.",
          },
        ].map((item) => (
          <article key={item.title} className="glass-card">
            <h2 className="font-heading text-2xl text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3 md:px-10">
        {[
          {
            title: "Odeme Onayli Indirme",
            text: "Ucretli paketlerde, payment_status paid olmadikca signed URL uretilmez.",
          },
          {
            title: "Video Icerik Vitrini",
            text: "Her yazilim paketi icin guven olusturan tanitim videolari yayinlayin.",
          },
          {
            title: "Uyeler Arasi Mesajlasma",
            text: "Musteri destek veya uye-uye iletisimini platform icinde tutun.",
          },
        ].map((item) => (
          <article key={item.title} className="glass-card">
            <h2 className="font-heading text-2xl text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">{item.text}</p>
          </article>
        ))}
      </section>

      <section id="iletisim" className="mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="glass-card mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs tracking-[0.16em] text-white/65">BASLANGIC</p>
            <h3 className="mt-2 font-heading text-3xl text-white">Platformu satisa ac</h3>
            <p className="mt-2 text-sm text-white/80">
              Supabase ayarlarini tamamla, paketlerini yukle ve uye akisini canliya al.
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
