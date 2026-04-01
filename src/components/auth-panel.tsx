"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "E-posta dogrulamasini tamamlayin, sonra tekrar giris yapin.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "E-posta veya sifre hatali.";
  }

  if (normalized.includes("user already registered")) {
    return "Bu e-posta adresi zaten kayitli.";
  }

  if (normalized.includes("signup is disabled")) {
    return "Supabase tarafinda uye olma kapali. Auth ayarlarindan Email provider'i acin.";
  }

  return message;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function AuthPanel() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase || typeof window === "undefined") {
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("type") === "recovery") {
      setRecoveryMode(true);
      setMessage("Kurtarma baglantisi algilandi. Yeni sifrenizi belirleyin.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setMessage("Kurtarma oturumu acildi. Yeni sifrenizi belirleyin.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const onSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setBusy(false);
      setMessage("Gecerli bir e-posta girin.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    setBusy(false);
    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    router.refresh();
    setMessage("Giris basarili. Yonetim alanina yonlendiriliyorsunuz.");
    window.location.href = "/paketler";
  };

  const onSignUp = async () => {
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setBusy(false);
      setMessage("Gecerli bir e-posta girin.");
      return;
    }

    const redirectUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/giris`
        : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setBusy(false);
    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    if (data.session) {
      router.refresh();
      setMessage("Uyelik tamamlandi. Yonetim alanina yonlendiriliyorsunuz.");
      window.location.href = "/paketler";
      return;
    }

    setMessage("Uyelik istegi olusturuldu. E-posta dogrulamasini tamamlayin ve tekrar giris yapin.");
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

  const onForgotPassword = async () => {
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const targetEmail = normalizeEmail(email);
    if (!targetEmail || !targetEmail.includes("@")) {
      setBusy(false);
      setMessage("Sifre sifirlama icin once e-posta girin.");
      return;
    }

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/giris` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo });

    setBusy(false);
    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    setMessage("Sifre sifirlama baglantisi e-posta adresinize gonderildi.");
  };

  const onMagicLinkSignIn = async () => {
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const targetEmail = normalizeEmail(email);
    if (!targetEmail || !targetEmail.includes("@")) {
      setBusy(false);
      setMessage("Baglanti gondermek icin once e-posta girin.");
      return;
    }

    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/giris` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { emailRedirectTo: redirectTo },
    });

    setBusy(false);
    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    setMessage("Giris baglantisi e-posta adresinize gonderildi.");
  };

  const onResetPassword = async () => {
    setBusy(true);
    setMessage("");

    if (!supabase) {
      setBusy(false);
      setMessage("Supabase ortam degiskenleri tanimli degil.");
      return;
    }

    const nextPassword = newPassword.trim();
    const nextConfirm = confirmPassword.trim();

    if (!nextPassword || nextPassword.length < 8) {
      setBusy(false);
      setMessage("Yeni sifre en az 8 karakter olmali.");
      return;
    }

    if (nextPassword !== nextConfirm) {
      setBusy(false);
      setMessage("Sifre tekrari uyusmuyor.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nextPassword });

    setBusy(false);
    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    setRecoveryMode(false);
    setNewPassword("");
    setConfirmPassword("");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, document.title, "/giris");
    }
    setMessage("Sifreniz guncellendi. Yeni sifrenizle giris yapabilirsiniz.");
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
        {!recoveryMode ? (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sifre"
            required
            minLength={6}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
          />
        ) : (
          <>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni sifre"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni sifre (tekrar)"
              required
              minLength={8}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
            />
          </>
        )}
        <div className="flex flex-wrap gap-2">
          {!recoveryMode ? (
            <>
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
                onClick={onForgotPassword}
                disabled={busy}
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
              >
                Sifremi Unuttum
              </button>
              <button
                type="button"
                onClick={onMagicLinkSignIn}
                disabled={busy}
                className="rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 disabled:opacity-60"
              >
                E-posta Giris Linki Gonder
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onResetPassword}
              disabled={busy}
              className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
            >
              Yeni Sifreyi Kaydet
            </button>
          )}
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
