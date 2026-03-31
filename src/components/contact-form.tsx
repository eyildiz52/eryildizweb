"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectType, setProjectType] = useState("Masaustu Yazilim");
  const [budgetRange, setBudgetRange] = useState("0 - 50.000 TL");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          companyName,
          email,
          phone,
          projectType,
          budgetRange,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error ?? "Form gonderilemedi.");
        return;
      }

      setStatus("Talebiniz alindi. Ekibimiz en kisa surede sizinle iletisime gececek.");
      setFullName("");
      setCompanyName("");
      setEmail("");
      setPhone("");
      setProjectType("Masaustu Yazilim");
      setBudgetRange("0 - 50.000 TL");
      setMessage("");
    } catch {
      setStatus("Sunucuya baglanirken hata olustu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="glass-card space-y-3">
      <h3 className="font-heading text-2xl text-white">Projeni Baslatalim</h3>
      <p className="text-sm leading-7 text-white/75">
        Yazilim paketi satis altyapisi, demo dagitimi, video vitrini ve uye mesajlasmasi icin
        teklif iste.
      </p>

      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Ad Soyad"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
      />
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Firma Adi"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        >
          <option className="bg-[#0b1220]">Masaustu Yazilim</option>
          <option className="bg-[#0b1220]">Web Uygulamasi</option>
          <option className="bg-[#0b1220]">E-Ticaret ve Satis Platformu</option>
          <option className="bg-[#0b1220]">Entegrasyon Projesi</option>
        </select>
        <select
          value={budgetRange}
          onChange={(e) => setBudgetRange(e.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
        >
          <option className="bg-[#0b1220]">0 - 50.000 TL</option>
          <option className="bg-[#0b1220]">50.000 - 150.000 TL</option>
          <option className="bg-[#0b1220]">150.000 TL ve uzeri</option>
        </select>
      </div>

      <textarea
        required
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Kisa proje ozeti"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
      />

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
      >
        Teklif Talebi Gonder
      </button>

      {status ? <p className="text-xs text-[#ffd98a]">{status}</p> : null}
    </form>
  );
}
