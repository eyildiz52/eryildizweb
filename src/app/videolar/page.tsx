import type { Metadata } from "next";
import Image from "next/image";
import { getPublishedVideos } from "@/lib/platform-data";
import { videosPageHighlights } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Videolar | ER YILDIZ YAZILIM",
};

export default async function VideosPage() {
  const videos = await getPublishedVideos();

  return (
    <main className="relative mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="page-glow page-glow-left" aria-hidden="true" />
      <div className="page-glow page-glow-right" aria-hidden="true" />

      <section className="mb-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.16em] text-white/65">VIDEO GALERISI</p>
          <h1 className="mt-2 font-heading text-4xl text-white md:text-5xl">Urun tanitim videolariyla guveni ilk ekranda kurun</h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-white/80 md:text-base">
            Video galerisi sadece tanitim alani degil, kullanicinin urunu anlamasini hizlandiran satis katmanidir. Kurulum, kullanim mantigi ve urun degeri videoyla daha kolay aktarilir.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {videosPageHighlights.map((item) => (
            <article key={item.title} className="glass-card p-4">
              <p className="font-heading text-lg text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-white/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {videos.length === 0 ? (
          <article className="glass-card md:col-span-2">
            <h2 className="font-heading text-2xl text-white">Yayindaki video yok</h2>
            <p className="mt-2 text-sm text-white/75">Panelden video eklediginizde burada listelenecek.</p>
          </article>
        ) : (
          videos.map((video) => (
            <article key={video.id} className="feature-panel overflow-hidden p-0">
              <div className="relative aspect-video w-full overflow-hidden border-b border-white/10 bg-[#08111f]">
                {video.cover_url ? (
                  <Image
                    src={video.cover_url}
                    alt={video.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08111f] via-[#08111f]/35 to-transparent" />
                <div className="absolute bottom-4 left-4 rounded-full border border-[#f8b84e]/25 bg-[#08111f]/75 px-3 py-1 text-xs tracking-[0.16em] text-[#ffe0a5]">
                  VIDEO
                </div>
              </div>

              <div className="p-5">
                <h2 className="font-heading text-2xl text-white">{video.title}</h2>
                <p className="mt-3 text-sm leading-7 text-white/80">{video.summary}</p>
              </div>
              <a
                href={video.video_url}
                target="_blank"
                rel="noreferrer"
                className="mx-5 mb-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#f8b84e]/35 bg-[#f8b84e]/15 px-5 py-2.5 text-sm font-semibold text-[#ffe0a5] transition hover:bg-[#f8b84e]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8b84e]/60"
              >
                Videoyu Ac
              </a>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
