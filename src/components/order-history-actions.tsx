"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  packageSlug?: string;
  canDownload: boolean;
};

export function OrderHistoryActions({ packageSlug, canDownload }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const onDownload = async () => {
    if (!packageSlug || !canDownload) {
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const res = await fetch(`/api/downloads/${packageSlug}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error ?? "Indirme baslatilamadi.");
        return;
      }

      window.location.href = data.downloadUrl;
    } catch {
      setStatus("Indirme istegi sirasinda hata olustu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {packageSlug ? (
        <Link
          href={`/paketler#pkg-${packageSlug}`}
          className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/90"
        >
          Pakete Git
        </Link>
      ) : null}

      {canDownload ? (
        <button
          onClick={onDownload}
          disabled={busy || !packageSlug}
          className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
        >
          Hemen Indir
        </button>
      ) : null}

      {status ? <p className="w-full text-xs text-[#ffd98a]">{status}</p> : null}
    </div>
  );
}
