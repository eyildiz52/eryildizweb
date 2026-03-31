"use client";

import { useState } from "react";
import type { SoftwarePackage } from "@/lib/types";

type Props = {
  item: SoftwarePackage;
  hasUser: boolean;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
};

export function PackageActions({ item, hasUser, paymentStatus }: Props) {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const isPaid = paymentStatus === "paid";
  const isPending = paymentStatus === "pending";

  const requestOrder = async () => {
    if (!hasUser) {
      setStatus("Satin alma talebi icin once giris yapin.");
      return;
    }

    if (isPaid) {
      setStatus("Bu paket zaten satin alinmis. Dogrudan indirebilirsiniz.");
      return;
    }

    if (isPending) {
      setStatus("Bu paket icin odeme zaten beklemede. Odeme adimini tamamlayin.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: item.id, packageSlug: item.slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error ?? "Satin alma talebi olusturulamadi.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
        return;
      }

      setStatus("Talebiniz alindi. Odeme onayi sonrasi indirme aktif edilir.");
    } catch {
      setStatus("Sunucu hatasi olustu.");
    } finally {
      setBusy(false);
    }
  };

  const downloadPackage = async () => {
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch(`/api/downloads/${item.slug}`, {
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
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        {item.package_type === "paid" ? (
          <button
            onClick={requestOrder}
            disabled={busy || isPaid}
            className="rounded-full bg-[#ffd166] px-4 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
          >
            {isPaid ? "Satin Alindi" : isPending ? "Odeme Bekleniyor" : "Satin Al"}
          </button>
        ) : null}

        <button
          onClick={downloadPackage}
          disabled={busy}
          className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {item.package_type === "paid" ? "Indirmeyi Dene" : "Demo Indir"}
        </button>

        {item.demo_url ? (
          <a
            href={item.demo_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/90"
          >
            Demo Videosu
          </a>
        ) : null}
      </div>

      {status ? <p className="text-xs text-[#ffd98a]">{status}</p> : null}
    </div>
  );
}
