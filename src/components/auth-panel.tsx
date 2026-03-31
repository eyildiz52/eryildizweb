"use client";

import { FormEvent, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function AuthPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const onSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Giris basarili. Sayfayi yenileyin veya menuye donun.");
  };

  const onSignUp = async () => {
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });

    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Uyelik istegi olusturuldu. E-posta dogrulamasini tamamlayin.");
  };

  const onSignOut = async () => {
    setBusy(true);
    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    await supabase.auth.signOut();
    setBusy(false);
    setMessage("Cikis yapildi.");
  };

  return (
    <div className="glass-card max-w-lg space-y-4">
      <h1 className="font-heading text-3xl text-white">Uye Girisi</h1>
      <p className="text-sm text-white/75">
        Uye olduktan sonra odeme onayi alan paketleri indirebilir, mesajlasma alanina
        ulasabilirsiniz.
      </p>

      <form onSubmit={onSignIn} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          required
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sifre"
          required
          minLength={6}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
          >
            Giris Yap
          </button>
          <button
            type="button"
            onClick={onSignUp}
            disabled={busy}
            className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Uye Ol
          </button>
          <button
            type="button"
            onClick={onSignOut}
            disabled={busy}
            className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
          >
            Cikis Yap
          </button>
        </div>
      </form>

      {message ? <p className="text-xs text-[#ffd98a]">{message}</p> : null}
    </div>
  );
}
