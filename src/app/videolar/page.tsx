import type { Metadata } from "next";
import { getPublishedVideos } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "Videolar | ER YILDIZ YAZILIM",
};

export default async function VideosPage() {
  const videos = await getPublishedVideos();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="mb-8">
        <p className="text-xs tracking-[0.16em] text-white/65">VIDEO GALERISI</p>
        <h1 className="font-heading text-4xl text-white">Urun Tanitim Videolari</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
          Kendi videolarinizi yayinlayip her paketin degerini kurumsal dille anlatabilirsiniz.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        {videos.length === 0 ? (
          <article className="glass-card md:col-span-2">
            <h2 className="font-heading text-2xl text-white">Yayindaki video yok</h2>
            <p className="mt-2 text-sm text-white/75">Panelden video eklediginizde burada listelenecek.</p>
          </article>
        ) : (
          videos.map((video) => (
            <article key={video.id} className="glass-card">
              <div className="rounded-xl border border-white/15 bg-[#0b1220] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">Video</p>
                <h2 className="mt-2 font-heading text-2xl text-white">{video.title}</h2>
                <p className="mt-2 text-sm text-white/80">{video.summary}</p>
              </div>
              <a
                href={video.video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full border border-white/30 px-4 py-2 text-sm text-white"
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
