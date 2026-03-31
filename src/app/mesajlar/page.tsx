import type { Metadata } from "next";
import Link from "next/link";
import { MessageComposer } from "@/components/message-composer";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mesajlar | ER YILDIZ YAZILIM",
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
};

export default async function MessagesPage() {
  const supabase = await getSupabaseServerClient();
  const user = supabase
    ? (await supabase.auth.getUser()).data.user
    : null;

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <div className="glass-card">
          <h1 className="font-heading text-3xl text-white">Mesajlar icin giris gerekli</h1>
          <p className="mt-3 text-sm text-white/80">
            Uye olduktan sonra destek ekibiyle veya diger uyelerle mesajlasabilirsiniz.
          </p>
          <Link
            href="/giris"
            className="mt-5 inline-flex rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937]"
          >
            Giris Yap
          </Link>
        </div>
      </main>
    );
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10">
        <div className="glass-card">
          <h1 className="font-heading text-3xl text-white">Mesajlasma Hazir Degil</h1>
          <p className="mt-3 text-sm text-white/80">
            SUPABASE_SERVICE_ROLE_KEY tanimli olmadigi icin mesaj modulu devre disi.
          </p>
        </div>
      </main>
    );
  }

  const [messagesRes, usersRes] = await Promise.all([
    admin
      .from("messages")
      .select("id,sender_id,receiver_id,body,created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(30),
    admin.from("profiles").select("id,email,full_name").neq("id", user.id).limit(50),
  ]);

  const messages = (messagesRes.data ?? []) as MessageRow[];
  const users = (usersRes.data ?? []) as ProfileRow[];
  const profileById = new Map<string, ProfileRow>(users.map((item) => [item.id, item]));

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-10">
      <MessageComposer receivers={users} />

      <section className="glass-card space-y-3">
        <h2 className="font-heading text-2xl text-white">Son Mesajlar</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-white/75">Henuz mesaj yok.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/85">
              <p className="text-xs text-white/60">{new Date(message.created_at).toLocaleString("tr-TR")}</p>
              <p className="mt-2">{message.body}</p>
              <p className="mt-2 text-xs text-white/60">
                Gonderen: {message.sender_id === user.id
                  ? "Siz"
                  : (profileById.get(message.sender_id)?.full_name
                      ?? profileById.get(message.sender_id)?.email
                      ?? message.sender_id)}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
