import Image from "next/image";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/channel/UCRZrC5Ljrrrv2LBTcY32Wbg";

export async function TopNav() {
  const supabase = await getSupabaseServerClient();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08111f]/85 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-6 py-4 md:flex-nowrap md:justify-between md:px-10">
        <div className="flex w-full items-center justify-between md:w-auto">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Image
              src="/Simge.png"
              alt="ER YILDIZ YAZILIM logosu"
              width={34}
              height={34}
              className="h-[34px] w-[34px] rounded-md border border-white/20"
              priority
            />
            <span className="font-heading text-lg tracking-wide">ER YILDIZ YAZILIM</span>
          </Link>
          <Link
            href="/giris"
            className="rounded-full border border-white/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white md:hidden"
          >
            {user ? "Hesabim" : "Giris"}
          </Link>
        </div>

        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85 md:w-auto md:justify-end">
          {[
            { href: "/paketler", label: "Paketler" },
            { href: "/demolar", label: "Demolar" },
            { href: "/videolar", label: "Videolar" },
            ...(user ? [{ href: "/yonetim", label: "Yonetim" }] : []),
            { href: "/mesajlar", label: "Mesajlar" },
            { href: YOUTUBE_CHANNEL_URL, label: "YouTube", external: true },
          ].map((item) => (
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            )
          ))}

          <Link
            href="/giris"
            className="hidden rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] hover:bg-white/10 md:inline-flex"
          >
            {user ? "Hesabim" : "Uye Ol / Giris"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
