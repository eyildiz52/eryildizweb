import type { Metadata } from "next";
import { PackageActions } from "@/components/package-actions";
import { getDemoPackages } from "@/lib/platform-data";
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
    <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <div className="mb-8">
        <p className="text-xs tracking-[0.16em] text-white/65">DEMOLAR</p>
        <h1 className="font-heading text-4xl text-white">Aninda Indirilebilir Demo Alanı</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
          Demolar bolumu, urunu satin almadan once test etmek isteyen ziyaretciler icin aciktir.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        {demoPackages.length === 0 ? (
          <article className="glass-card md:col-span-2">
            <h2 className="font-heading text-2xl text-white">Henuz demo eklenmedi</h2>
            <p className="mt-2 text-sm text-white/75">Panelden yeni bir demo paket ekleyebilirsiniz.</p>
          </article>
        ) : (
          demoPackages.map((item) => (
            <article key={item.id} className="glass-card">
              <h2 className="font-heading text-3xl text-white">{item.title}</h2>
              <p className="mt-3 text-sm text-white/80">{item.short_description}</p>
              <PackageActions item={item} hasUser={Boolean(user)} />
            </article>
          ))
        )}
      </section>
    </main>
  );
}
