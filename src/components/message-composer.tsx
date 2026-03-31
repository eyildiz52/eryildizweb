"use client";

import { FormEvent, useState } from "react";

type Receiver = {
  id: string;
  full_name: string | null;
  email: string;
};

type Props = {
  receivers: Receiver[];
};

export function MessageComposer({ receivers }: Props) {
  const [receiverId, setReceiverId] = useState(receivers[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (receivers.length === 0) {
      setStatus("Mesaj gonderebileceginiz uye bulunamadi.");
      return;
    }

    if (!receiverId || !body.trim()) {
      setStatus("Alici ve mesaj metni zorunlu.");
      return;
    }

    setBusy(true);
    setStatus("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, body }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setStatus(data.error ?? "Mesaj gonderilemedi.");
      return;
    }

    setBody("");
    setStatus("Mesaj gonderildi. Listeyi yenileyin.");
  };

  return (
    <form onSubmit={onSubmit} className="glass-card space-y-3">
      <h2 className="font-heading text-2xl text-white">Yeni Mesaj</h2>

      <select
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
        disabled={receivers.length === 0}
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
      >
        {receivers.length === 0 ? (
          <option className="bg-[#0b1220]">Alici listesi bos</option>
        ) : null}
        {receivers.map((receiver) => (
          <option key={receiver.id} value={receiver.id} className="bg-[#0b1220]">
            {(receiver.full_name ?? receiver.email) + " (" + receiver.email + ")"}
          </option>
        ))}
      </select>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Mesajinizi yazin"
        rows={4}
        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none"
      />

      <button
        type="submit"
        disabled={busy || receivers.length === 0}
        className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
      >
        Gonder
      </button>

      {status ? <p className="text-xs text-[#ffd98a]">{status}</p> : null}
    </form>
  );
}
