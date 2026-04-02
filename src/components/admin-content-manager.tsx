"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminVideo = {
  id: string;
  title: string;
  summary: string;
  video_url: string;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
};

type AdminPackage = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string | null;
  package_type: "demo" | "paid";
  price: number;
  currency: string;
  storage_bucket: string;
  storage_path: string;
  demo_url: string | null;
  is_active: boolean;
  created_at: string;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: "admin" | "member";
  created_at: string;
  updated_at: string | null;
};

type AdminOrder = {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  currency: string;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_reference: string | null;
  created_at: string;
  updated_at: string | null;
};

type Props = {
  initialVideos: AdminVideo[];
  initialPackages: AdminPackage[];
  initialUsers: AdminUser[];
  initialOrders: AdminOrder[];
};

type DraftVideo = {
  title: string;
  summary: string;
  video_url: string;
  cover_url: string;
  is_published: boolean;
};

type DraftPackage = {
  package_type: "demo" | "paid";
  title: string;
  short_description: string;
  long_description: string;
  price: string;
  currency: string;
  storage_bucket: string;
  storage_path: string;
  demo_url: string;
  is_active: boolean;
};

type DraftUser = {
  email: string;
  full_name: string;
  company_name: string;
  role: "admin" | "member";
  password: string;
};

function toDraftVideo(video: AdminVideo): DraftVideo {
  return {
    title: video.title,
    summary: video.summary,
    video_url: video.video_url,
    cover_url: video.cover_url ?? "",
    is_published: video.is_published,
  };
}

function toDraftPackage(item: AdminPackage): DraftPackage {
  return {
    package_type: item.package_type,
    title: item.title,
    short_description: item.short_description,
    long_description: item.long_description ?? "",
    price: String(item.price),
    currency: item.currency,
    storage_bucket: item.storage_bucket,
    storage_path: item.storage_path,
    demo_url: item.demo_url ?? "",
    is_active: item.is_active,
  };
}

function toDraftUser(user: AdminUser): DraftUser {
  return {
    email: user.email,
    full_name: user.full_name ?? "",
    company_name: user.company_name ?? "",
    role: user.role,
    password: "",
  };
}

function normalizeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toLowerCase() ?? "zip";
  return extension ? extension.replace(/[^a-z0-9]/g, "") || "zip" : "zip";
}

function normalizeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const safe = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safe || "paket";
}

function buildPackageStoragePath(packageId: string, packageType: "demo" | "paid", fileName: string) {
  const extension = normalizeExtension(fileName);
  const baseName = normalizeBaseName(fileName);
  const folder = packageType === "demo" ? "demo" : "paid";
  return `${folder}/${packageId}/${baseName}.${extension}`;
}

function isPackageDraftDirty(item: AdminPackage, draft: DraftPackage) {
  const original = toDraftPackage(item);
  return (
    original.package_type !== draft.package_type ||
    original.title !== draft.title ||
    original.short_description !== draft.short_description ||
    original.long_description !== draft.long_description ||
    original.price !== draft.price ||
    original.currency !== draft.currency ||
    original.storage_bucket !== draft.storage_bucket ||
    original.storage_path !== draft.storage_path ||
    original.demo_url !== draft.demo_url ||
    original.is_active !== draft.is_active
  );
}

function getOrderStatusLabel(status: AdminOrder["payment_status"]) {
  if (status === "pending") return "Odeme Bekleniyor";
  if (status === "paid") return "Odeme Onaylandi";
  if (status === "failed") return "Odeme Basarisiz";
  return "Iade Edildi";
}

function getOrderStatusClass(status: AdminOrder["payment_status"]) {
  if (status === "pending") return "border-amber-300/40 bg-amber-500/15 text-amber-100";
  if (status === "paid") return "border-emerald-300/40 bg-emerald-500/15 text-emerald-100";
  if (status === "failed") return "border-rose-300/40 bg-rose-500/15 text-rose-100";
  return "border-slate-300/40 bg-slate-500/15 text-slate-100";
}

function getPackageTypeLabel(type: "demo" | "paid") {
  return type === "paid" ? "Ucretli Paket" : "Demo Paket";
}

export function AdminContentManager({ initialVideos, initialPackages, initialUsers, initialOrders }: Props) {
  const [videos, setVideos] = useState<AdminVideo[]>(initialVideos);
  const [packages, setPackages] = useState<AdminPackage[]>(initialPackages);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [videoDrafts, setVideoDrafts] = useState<Record<string, DraftVideo>>(() => {
    const entries = initialVideos.map((video) => [video.id, toDraftVideo(video)] as const);
    return Object.fromEntries(entries);
  });
  const [packageDrafts, setPackageDrafts] = useState<Record<string, DraftPackage>>(() => {
    const entries = initialPackages.map((item) => [item.id, toDraftPackage(item)] as const);
    return Object.fromEntries(entries);
  });
  const [newPackage, setNewPackage] = useState<DraftPackage>({
    package_type: "demo",
    title: "",
    short_description: "",
    long_description: "",
    price: "0",
    currency: "TRY",
    storage_bucket: "software-files",
    storage_path: "",
    demo_url: "",
    is_active: true,
  });
  const [userDrafts, setUserDrafts] = useState<Record<string, DraftUser>>(() => {
    const entries = initialUsers.map((user) => [user.id, toDraftUser(user)] as const);
    return Object.fromEntries(entries);
  });
  const [newVideo, setNewVideo] = useState<DraftVideo>({
    title: "",
    summary: "",
    video_url: "",
    cover_url: "",
    is_published: true,
  });
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    company_name: "",
    role: "member" as "admin" | "member",
  });
  const [showNewUser, setShowNewUser] = useState(false);
  const [busyKey, setBusyKey] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [fileInputKeys, setFileInputKeys] = useState<Record<string, number>>({});

  const publishedCount = useMemo(
    () => videos.filter((item) => item.is_published).length,
    [videos]
  );
  const adminCount = useMemo(
    () => users.filter((item) => item.role === "admin").length,
    [users]
  );
  const pendingOrderCount = useMemo(
    () => orders.filter((item) => item.payment_status === "pending").length,
    [orders]
  );

  const writeMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => {
      setMessage((current) => (current === text ? "" : current));
    }, 4000);
  };

  const refreshVideos = async () => {
    const res = await fetch("/api/admin/videos", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Video listesi yenilenemedi.");
    }

    const nextVideos = (data.videos ?? []) as AdminVideo[];
    setVideos(nextVideos);
    setVideoDrafts(
      Object.fromEntries(nextVideos.map((video) => [video.id, toDraftVideo(video)]))
    );
  };

  const refreshPackages = async () => {
    const res = await fetch("/api/admin/packages", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Paket listesi yenilenemedi.");
    }

    const nextPackages = (data.packages ?? []) as AdminPackage[];
    setPackages(nextPackages);
    setPackageDrafts(
      Object.fromEntries(nextPackages.map((item) => [item.id, toDraftPackage(item)]))
    );
  };

  const updatePackageDraft = (id: string, next: Partial<DraftPackage>) => {
    setPackageDrafts((old) => {
      const fallbackPackage = packages.find((item) => item.id === id);
      if (!old[id] && !fallbackPackage) {
        return old;
      }

      const current = old[id] ?? toDraftPackage(fallbackPackage as AdminPackage);
      return {
        ...old,
        [id]: {
          ...current,
          ...next,
        },
      };
    });
  };

  const applyPackageSnapshot = (pkg: AdminPackage) => {
    setPackages((old) => old.map((item) => (item.id === pkg.id ? pkg : item)));
    setPackageDrafts((old) => ({
      ...old,
      [pkg.id]: toDraftPackage(pkg),
    }));
  };

  const refreshUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Kullanici listesi yenilenemedi.");
    }

    const nextUsers = (data.users ?? []) as AdminUser[];
    setUsers(nextUsers);
    setUserDrafts(
      Object.fromEntries(nextUsers.map((user) => [user.id, toDraftUser(user)]))
    );
  };

  const refreshOrders = async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error ?? "Siparis listesi yenilenemedi.");
    }

    setOrders((data.orders ?? []) as AdminOrder[]);
  };

  const setOrderStatus = async (orderId: string, status: AdminOrder["payment_status"]) => {
    setBusyKey(`order-${orderId}-${status}`);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Siparis durumu guncellenemedi.");
      }

      await refreshOrders();
      writeMessage("Siparis durumu guncellendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Siparis durumu guncellenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const createVideo = async () => {
    setBusyKey("new-video");
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newVideo.title,
          summary: newVideo.summary,
          videoUrl: newVideo.video_url,
          coverUrl: newVideo.cover_url,
          isPublished: newVideo.is_published,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Video eklenemedi.");
      }

      setNewVideo({
        title: "",
        summary: "",
        video_url: "",
        cover_url: "",
        is_published: true,
      });
      await refreshVideos();
      writeMessage("Video eklendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Video eklenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const saveVideo = async (id: string) => {
    const draft = videoDrafts[id];
    if (!draft) {
      return;
    }

    setBusyKey(`video-${id}`);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: draft.title,
          summary: draft.summary,
          videoUrl: draft.video_url,
          coverUrl: draft.cover_url,
          isPublished: draft.is_published,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Video guncellenemedi.");
      }

      await refreshVideos();
      writeMessage("Video guncellendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Video guncellenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const deleteVideo = async (id: string) => {
    if (!window.confirm("Bu videoyu silmek istediginize emin misiniz?")) {
      return;
    }

    setBusyKey(`video-del-${id}`);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Video silinemedi.");
      }

      await refreshVideos();
      writeMessage("Video silindi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Video silinemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const createPackage = async () => {
    if (!newPackage.title.trim()) {
      writeMessage("Paket basligi zorunludur.");
      return;
    }
    if (!newPackage.short_description.trim()) {
      writeMessage("Kisa aciklama zorunludur.");
      return;
    }

    setBusyKey("new-package");
    try {
      const res = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newPackage.title.toLowerCase().replace(/\s+/g, "-"),
          packageType: newPackage.package_type,
          title: newPackage.title,
          shortDescription: newPackage.short_description,
          longDescription: newPackage.long_description || null,
          price: Number(newPackage.price),
          currency: newPackage.currency,
          storageBucket: newPackage.storage_bucket,
          storagePath: newPackage.storage_path,
          demoUrl: newPackage.demo_url || null,
          isActive: newPackage.is_active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Paket olusturulamadi.");
      }

      setNewPackage({
        package_type: "demo",
        title: "",
        short_description: "",
        long_description: "",
        price: "0",
        currency: "TRY",
        storage_bucket: "software-files",
        storage_path: "",
        demo_url: "",
        is_active: true,
      });
      await refreshPackages();
      writeMessage("Yeni paket olusturuldu.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Paket olusturulamadi.");
    } finally {
      setBusyKey("");
    }
  };

  const deletePackage = async (id: string) => {
    if (!window.confirm("Bu paketi silmek istediginize emin misiniz?")) {
      return;
    }

    setBusyKey(`package-del-${id}`);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Paket silinemedi.");
      }

      await refreshPackages();
      writeMessage("Paket silindi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Paket silinemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const savePackage = async (id: string) => {
    const draft = packageDrafts[id];
    if (!draft) {
      return;
    }

    const storageBucket = draft.storage_bucket.trim();
    const storagePath = draft.storage_path.trim();
    const payload: Record<string, unknown> = {
      id,
      packageType: draft.package_type,
      title: draft.title,
      shortDescription: draft.short_description,
      longDescription: draft.long_description,
      price: Number(draft.price),
      currency: draft.currency,
      demoUrl: draft.demo_url,
      isActive: draft.is_active,
    };

    if (storagePath) {
      payload.storageBucket = storageBucket || "software-files";
      payload.storagePath = storagePath;
    }

    setBusyKey(`package-${id}`);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { error: `Sunucu beklenmeyen bir yanit dondurdu. HTTP ${res.status}` };

      if (!res.ok) {
        throw new Error(data.error ?? `Paket guncellenemedi. HTTP ${res.status}`);
      }

      if (data?.package) {
        applyPackageSnapshot(data.package as AdminPackage);
      }
      writeMessage("Paket guncellendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Paket guncellenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const uploadPackageFile = async (item: AdminPackage) => {
    const file = selectedFiles[item.id];
    const draft = packageDrafts[item.id] ?? toDraftPackage(item);
    if (!file) {
      writeMessage("Once yüklenecek dosyayi secin.");
      return;
    }

    setBusyKey(`upload-${item.id}`);

    try {
      const computedPath = draft.storage_path.trim()
        ? draft.storage_path.trim()
        : buildPackageStoragePath(item.id, draft.package_type, file.name);

      updatePackageDraft(item.id, {
        storage_bucket: draft.storage_bucket.trim() || "software-files",
        storage_path: computedPath,
      });

      const ticketRes = await fetch("/api/admin/packages/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: item.id,
          packageType: draft.package_type,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          suggestedPath: computedPath,
        }),
      });

      const ticketData = await ticketRes.json();
      if (!ticketRes.ok) {
        throw new Error(ticketData.error ?? "Upload izni alinamadi.");
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase browser ayarlari eksik.");
      }

      const { error: uploadError } = await supabase.storage
        .from(ticketData.bucket)
        .uploadToSignedUrl(ticketData.path, ticketData.token, file, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const persistRes = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          storageBucket: ticketData.bucket,
          storagePath: ticketData.path,
        }),
      });

      const persistContentType = persistRes.headers.get("content-type") ?? "";
      const persistData = persistContentType.includes("application/json")
        ? await persistRes.json()
        : { error: `Sunucu beklenmeyen bir yanit dondurdu. HTTP ${persistRes.status}` };

      if (!persistRes.ok) {
        throw new Error(persistData.error ?? `Yuklenen dosya yolu kaydedilemedi. HTTP ${persistRes.status}`);
      }

      if (persistData?.package) {
        applyPackageSnapshot(persistData.package as AdminPackage);
      } else {
        updatePackageDraft(item.id, {
          storage_bucket: ticketData.bucket,
          storage_path: ticketData.path,
        });
      }

      setSelectedFiles((old) => ({ ...old, [item.id]: null }));
      setFileInputKeys((old) => ({ ...old, [item.id]: (old[item.id] ?? 0) + 1 }));
      writeMessage("Dosya Storage'a yuklendi ve paket yoluna kaydedildi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Dosya yuklenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const deletePackageFile = async (item: AdminPackage) => {
    const draft = packageDrafts[item.id] ?? toDraftPackage(item);
    const targetPath = `${draft.storage_bucket}/${draft.storage_path}`;

    if (!window.confirm(`Bu storage dosyasini silmek istediginize emin misiniz?\n${targetPath}`)) {
      return;
    }

    setBusyKey(`delete-upload-${item.id}`);

    try {
      const res = await fetch("/api/admin/packages/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: item.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Storage dosyasi silinemedi.");
      }

      setPackages((old) =>
        old.map((pkg) =>
          pkg.id === item.id
            ? {
                ...pkg,
                storage_path: "",
              }
            : pkg
        )
      );
      setPackageDrafts((old) => ({
        ...old,
        [item.id]: {
          ...(old[item.id] ?? toDraftPackage(item)),
          storage_path: "",
        },
      }));

      writeMessage("Storage dosyasi silindi. Isterseniz simdi dogru dosyayi yukleyebilirsiniz.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Storage dosyasi silinemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const saveUser = async (id: string) => {
    const draft = userDrafts[id];
    if (!draft) {
      return;
    }

    setBusyKey(`user-${id}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          email: draft.email,
          fullName: draft.full_name,
          companyName: draft.company_name,
          role: draft.role,
          password: draft.password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Kullanici guncellenemedi.");
      }

      await refreshUsers();
      writeMessage("Kullanici guncellendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Kullanici guncellenemedi.");
    } finally {
      setBusyKey("");
    }
  };

  const createUser = async () => {
    if (!newUser.email.trim()) {
      writeMessage("E-posta zorunludur.");
      return;
    }
    if (!newUser.password.trim()) {
      writeMessage("Yeni kullanici icin sifre zorunludur.");
      return;
    }
    if (newUser.password.trim().length < 8) {
      writeMessage("Sifre en az 8 karakter olmali.");
      return;
    }

    setBusyKey("new-user");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          fullName: newUser.full_name || undefined,
          companyName: newUser.company_name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Kullanici olusturulamadi.");
      }

      await refreshUsers();
      setNewUser({ email: "", password: "", full_name: "", company_name: "", role: "member" });
      setShowNewUser(false);
      writeMessage("Yeni kullanici olusturuldu.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Kullanici olusturulamadi.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-card space-y-3">
        <p className="text-xs tracking-[0.16em] text-white/65">YONETIM PANOSU</p>
        <h1 className="font-heading text-3xl text-white md:text-4xl">Icerik Yonetimi</h1>
        <p className="max-w-3xl text-sm leading-7 text-white/80">
          Bu panelde video vitrinini ve paket iceriklerini guncelleyebilirsiniz.
          Yayinlanan video sayisi su anda <span className="font-semibold text-[#ffd98a]">{publishedCount}</span>.
        </p>
        <p className="text-sm leading-7 text-white/70">
          Kullanicilar tarafinda toplam <span className="font-semibold text-[#ffd98a]">{adminCount}</span> admin hesap tanimli.
        </p>
        <p className="text-sm leading-7 text-white/70">
          Bekleyen siparis sayisi <span className="font-semibold text-[#ffd98a]">{pendingOrderCount}</span>.
        </p>
        {message ? (
          <p className="rounded-xl border border-[#f8b84e]/35 bg-[#f8b84e]/10 px-4 py-2 text-sm text-[#ffe0a5]">
            {message}
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="feature-panel space-y-3 p-5">
          <h2 className="font-heading text-2xl text-white">Yeni Video Ekle</h2>
          <input
            value={newVideo.title}
            onChange={(event) => setNewVideo((old) => ({ ...old, title: event.target.value }))}
            placeholder="Video basligi"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
          />
          <textarea
            value={newVideo.summary}
            onChange={(event) => setNewVideo((old) => ({ ...old, summary: event.target.value }))}
            placeholder="Video aciklamasi"
            rows={3}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={newVideo.video_url}
            onChange={(event) => setNewVideo((old) => ({ ...old, video_url: event.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
          />
          <input
            value={newVideo.cover_url}
            onChange={(event) => setNewVideo((old) => ({ ...old, cover_url: event.target.value }))}
            placeholder="Cover URL (opsiyonel)"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
          />
          <label className="inline-flex items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={newVideo.is_published}
              onChange={(event) => setNewVideo((old) => ({ ...old, is_published: event.target.checked }))}
            />
            Yayinla
          </label>
          <button
            onClick={createVideo}
            disabled={busyKey === "new-video"}
            className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
          >
            {busyKey === "new-video" ? "Kaydediliyor..." : "Videoyu Ekle"}
          </button>
        </article>

        <article className="feature-panel p-5">
          <h2 className="font-heading text-2xl text-white">Video Listesi</h2>
          <div className="mt-4 space-y-4">
            {videos.length === 0 ? (
              <p className="text-sm text-white/75">Henuz video yok.</p>
            ) : (
              videos.map((video) => {
                const draft = videoDrafts[video.id] ?? toDraftVideo(video);
                return (
                  <div key={video.id} className="space-y-2 rounded-xl border border-white/15 bg-white/5 p-3">
                    <input
                      aria-label={`${video.title} video basligi`}
                      value={draft.title}
                      onChange={(event) =>
                        setVideoDrafts((old) => ({
                          ...old,
                          [video.id]: { ...draft, title: event.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                    <textarea
                      aria-label={`${video.title} video ozeti`}
                      value={draft.summary}
                      onChange={(event) =>
                        setVideoDrafts((old) => ({
                          ...old,
                          [video.id]: { ...draft, summary: event.target.value },
                        }))
                      }
                      rows={2}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                    <input
                      aria-label={`${video.title} video baglantisi`}
                      value={draft.video_url}
                      onChange={(event) =>
                        setVideoDrafts((old) => ({
                          ...old,
                          [video.id]: { ...draft, video_url: event.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-white/80">
                      <input
                        type="checkbox"
                        checked={draft.is_published}
                        onChange={(event) =>
                          setVideoDrafts((old) => ({
                            ...old,
                            [video.id]: { ...draft, is_published: event.target.checked },
                          }))
                        }
                      />
                      Yayinla
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => saveVideo(video.id)}
                        disabled={busyKey === `video-${video.id}`}
                        className="rounded-full bg-[#ffd166] px-4 py-1.5 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        disabled={busyKey === `video-del-${video.id}`}
                        className="rounded-full border border-red-300/45 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-60"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>

      <section className="feature-panel p-5">
        <h2 className="font-heading text-2xl text-white">Paket Yonetimi</h2>
        <p className="mt-2 text-sm text-white/75">Yeni paketler ekleyin veya mevcut paketleri düzenleyin.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <article className="feature-panel space-y-3 p-5">
            <h3 className="font-heading text-lg text-white">Yeni Paket Ekle</h3>
            <select
              aria-label="Yeni paket tipi"
              value={newPackage.package_type}
              onChange={(event) =>
                setNewPackage((old) => ({
                  ...old,
                  package_type: event.target.value === "paid" ? "paid" : "demo",
                }))
              }
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="paid" className="bg-[#08111f] text-white">
                Ucretli Paket
              </option>
              <option value="demo" className="bg-[#08111f] text-white">
                Demo Paket
              </option>
            </select>
            <input
              value={newPackage.title}
              onChange={(event) =>
                setNewPackage((old) => ({ ...old, title: event.target.value }))
              }
              placeholder="Paket basligi"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={newPackage.short_description}
              onChange={(event) =>
                setNewPackage((old) => ({ ...old, short_description: event.target.value }))
              }
              placeholder="Kisa aciklama"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            />
            <textarea
              value={newPackage.long_description}
              onChange={(event) =>
                setNewPackage((old) => ({ ...old, long_description: event.target.value }))
              }
              placeholder="Uzun aciklama (opsiyonel)"
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                type="number"
                value={newPackage.price}
                onChange={(event) =>
                  setNewPackage((old) => ({ ...old, price: event.target.value }))
                }
                placeholder="Fiyat"
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
              />
              <input
                value={newPackage.currency}
                onChange={(event) =>
                  setNewPackage((old) => ({ ...old, currency: event.target.value }))
                }
                placeholder="Para birimi"
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <input
              value={newPackage.demo_url}
              onChange={(event) =>
                setNewPackage((old) => ({ ...old, demo_url: event.target.value }))
              }
              placeholder="Demo URL (opsiyonel)"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
            />
            <label className="inline-flex items-center gap-2 text-sm text-white/90">
              <input
                type="checkbox"
                checked={newPackage.is_active}
                onChange={(event) =>
                  setNewPackage((old) => ({ ...old, is_active: event.target.checked }))
                }
              />
              Paketi aktif olarak yayınla
            </label>
            <button
              onClick={createPackage}
              disabled={busyKey === "new-package"}
              className="rounded-full bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#1f2937] disabled:opacity-60"
            >
              {busyKey === "new-package" ? "Kaydediliyor..." : "Yeni Paketi Ekle"}
            </button>
          </article>
        </div>

        <h3 className="font-heading text-lg text-white mt-6">Paket Listesi</h3>
        <div className="mt-4 space-y-4">
          {packages.map((item) => {
            const draft = packageDrafts[item.id] ?? toDraftPackage(item);
            const isRowBusy =
              busyKey === `upload-${item.id}` ||
              busyKey === `delete-upload-${item.id}` ||
              busyKey === `package-${item.id}` ||
              busyKey === `package-del-${item.id}`;
            return (
              <article key={item.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs text-white/60">
                  {draft.title} • {getPackageTypeLabel(draft.package_type)}
                </p>
                <p className="mt-1 text-[11px] text-white/45">Slug: {item.slug}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <select
                    aria-label={`${item.slug} paket tipi`}
                    value={draft.package_type}
                    onChange={(event) =>
                      updatePackageDraft(item.id, {
                        package_type: event.target.value === "paid" ? "paid" : "demo",
                      })
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="paid" className="bg-[#08111f] text-white">Ucretli Paket</option>
                    <option value="demo" className="bg-[#08111f] text-white">Demo Paket</option>
                  </select>
                  <input
                    aria-label={`${item.slug} paket basligi`}
                    value={draft.title}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { title: event.target.value })
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} para birimi`}
                    value={draft.currency}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { currency: event.target.value })
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} kisa aciklama`}
                    value={draft.short_description}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { short_description: event.target.value })
                    }
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <textarea
                    aria-label={`${item.slug} uzun aciklama`}
                    value={draft.long_description}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { long_description: event.target.value })
                    }
                    rows={3}
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} fiyat`}
                    value={draft.price}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { price: event.target.value })
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} storage bucket`}
                    value={draft.storage_bucket}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { storage_bucket: event.target.value })
                    }
                    placeholder="Storage Bucket"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} storage path`}
                    value={draft.storage_path}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { storage_path: event.target.value })
                    }
                    placeholder="Storage Path"
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    value={draft.demo_url}
                    onChange={(event) =>
                      updatePackageDraft(item.id, { demo_url: event.target.value })
                    }
                    placeholder="Demo URL"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-[#08111f]/50 p-3">
                  <p className="text-xs text-white/60">Mevcut Indirme Dosyasi</p>
                  <p className="mt-1 break-all text-sm text-white/85">
                    {draft.storage_bucket}/{draft.storage_path}
                  </p>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      key={fileInputKeys[item.id] ?? 0}
                      type="file"
                      aria-label={`${item.slug} dosya yukleme`}
                      onChange={(event) => {
                        const nextFile = event.target.files?.[0] ?? null;
                        setSelectedFiles((old) => ({
                          ...old,
                          [item.id]: nextFile,
                        }));

                        if (!nextFile) {
                          return;
                        }

                        const nextBucket = draft.storage_bucket.trim() || "software-files";
                        const nextPath = buildPackageStoragePath(
                          item.id,
                          draft.package_type,
                          nextFile.name
                        );

                        updatePackageDraft(item.id, {
                          storage_bucket: nextBucket,
                          storage_path: nextPath,
                        });
                      }}
                      className="block w-full text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-[#ffd166] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#1f2937]"
                    />
                    <button
                      onClick={() => uploadPackageFile(item)}
                      disabled={busyKey === `upload-${item.id}`}
                      className="rounded-full border border-[#f8b84e]/35 bg-[#f8b84e]/12 px-4 py-2 text-sm font-semibold text-[#ffe0a5] disabled:opacity-60"
                    >
                      {busyKey === `upload-${item.id}` ? "Yukleniyor..." : "Dosyayi Storage'a Yukle"}
                    </button>
                    <button
                      onClick={() => deletePackageFile(item)}
                      disabled={busyKey === `delete-upload-${item.id}`}
                      className="rounded-full border border-red-300/45 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 disabled:opacity-60"
                    >
                      {busyKey === `delete-upload-${item.id}` ? "Siliniyor..." : "Mevcut Dosyayi Sil"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-white/65">
                    Dosya tarayicidan dogrudan object storage&apos;a gider. Yukleme bitince paketin indirme yolu otomatik guncellenir.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(event) =>
                        updatePackageDraft(item.id, { is_active: event.target.checked })
                      }
                    />
                    Paket aktif
                  </label>
                  <button
                    onClick={() => savePackage(item.id)}
                    disabled={isRowBusy}
                    className="rounded-full bg-[#ffd166] px-4 py-1.5 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => deletePackage(item.id)}
                    disabled={isRowBusy}
                    className="rounded-full border border-red-300/45 bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-200 disabled:opacity-60"
                  >
                    {busyKey === `package-del-${item.id}` ? "Siliniyor..." : "Paketi Sil"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="feature-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-white">Siparis Yonetimi</h2>
            <p className="mt-2 text-sm text-white/75">
              Buradan odeme durumlarini guncelleyebilir, bekleyen siparisleri hizlica onaylayabilirsiniz.
            </p>
          </div>
          <button
            onClick={refreshOrders}
            className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            Yenile
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {orders.length === 0 ? (
            <p className="text-sm text-white/75">Henuz siparis yok.</p>
          ) : (
            orders.map((order) => {
              const customer = users.find((item) => item.id === order.user_id);
              const pkg = packages.find((item) => item.id === order.package_id);
              return (
                <article key={order.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-white/60">{order.id}</p>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${getOrderStatusClass(order.payment_status)}`}
                    >
                      {getOrderStatusLabel(order.payment_status)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-white/85 md:grid-cols-2">
                    <p>
                      Musteri: <span className="text-white">{customer?.email ?? order.user_id}</span>
                    </p>
                    <p>
                      Paket: <span className="text-white">{pkg?.title ?? order.package_id}</span>
                    </p>
                    <p>
                      Tutar: <span className="text-white">{order.amount} {order.currency}</span>
                    </p>
                    <p>
                      Tarih: <span className="text-white">{new Date(order.created_at).toLocaleString("tr-TR")}</span>
                    </p>
                    <p className="md:col-span-2">
                      Referans: <span className="text-white">{order.payment_reference ?? "-"}</span>
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setOrderStatus(order.id, "paid")}
                      disabled={busyKey === `order-${order.id}-paid`}
                      className="rounded-full bg-emerald-500/85 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Odeme Onayla
                    </button>
                    <button
                      onClick={() => setOrderStatus(order.id, "failed")}
                      disabled={busyKey === `order-${order.id}-failed`}
                      className="rounded-full bg-rose-500/85 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Basarisiz Isaretle
                    </button>
                    <button
                      onClick={() => setOrderStatus(order.id, "refunded")}
                      disabled={busyKey === `order-${order.id}-refunded`}
                      className="rounded-full bg-slate-500/85 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Iade Isaretle
                    </button>
                    <button
                      onClick={() => setOrderStatus(order.id, "pending")}
                      disabled={busyKey === `order-${order.id}-pending`}
                      className="rounded-full border border-amber-300/45 bg-amber-500/15 px-4 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-60"
                    >
                      Bekleyene Al
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="feature-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl text-white">Kullanici Yonetimi</h2>
            <p className="mt-2 text-sm text-white/75">
              Buradan rol degistirebilir, profil bilgilerini guncelleyebilir ve yeni sifre atayabilirsiniz.
            </p>
          </div>
          <button
            onClick={() => setShowNewUser((v) => !v)}
            className="rounded-full border border-[#ffd166]/50 bg-[#ffd166]/10 px-4 py-1.5 text-xs font-semibold text-[#ffd166] hover:bg-[#ffd166]/20 transition-colors"
          >
            {showNewUser ? "Iptal" : "+ Yeni Kullanici"}
          </button>
        </div>

        {showNewUser && (
          <article className="mt-4 rounded-xl border border-[#ffd166]/30 bg-[#ffd166]/5 p-4 space-y-3">
            <p className="text-xs font-semibold text-[#ffd98a] tracking-widest">YENI KULLANICI</p>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                placeholder="E-posta *"
                type="email"
              />
              <select
                aria-label="Yeni kullanici rolu"
                value={newUser.role}
                onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as "admin" | "member" }))}
                className="rounded-lg border border-white/20 bg-[#0f1b2d] px-3 py-2 text-sm text-white outline-none"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <input
                value={newUser.full_name}
                onChange={(e) => setNewUser((u) => ({ ...u, full_name: e.target.value }))}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                placeholder="Ad Soyad"
              />
              <input
                value={newUser.company_name}
                onChange={(e) => setNewUser((u) => ({ ...u, company_name: e.target.value }))}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                placeholder="Firma"
              />
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                placeholder="Sifre * (en az 8 karakter)"
              />
            </div>
            <button
              onClick={createUser}
              disabled={busyKey === "new-user"}
              className="rounded-full bg-[#ffd166] px-4 py-1.5 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
            >
              {busyKey === "new-user" ? "Olusturuluyor..." : "Kullanici Olustur"}
            </button>
          </article>
        )}

        <div className="mt-4 space-y-4">
          {users.map((user) => {
            const draft = userDrafts[user.id] ?? toDraftUser(user);
            return (
              <article key={user.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-white/60">
                    {user.id} • {new Date(user.created_at).toLocaleDateString("tr-TR")}
                  </p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/80">
                    {user.role.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input
                    value={draft.email}
                    onChange={(event) =>
                      setUserDrafts((old) => ({
                        ...old,
                        [user.id]: { ...draft, email: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="E-posta"
                  />
                  <select
                    aria-label={`${user.email} kullanici rolu`}
                    value={draft.role}
                    onChange={(event) =>
                      setUserDrafts((old) => ({
                        ...old,
                        [user.id]: { ...draft, role: event.target.value as "admin" | "member" },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-[#0f1b2d] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <input
                    value={draft.full_name}
                    onChange={(event) =>
                      setUserDrafts((old) => ({
                        ...old,
                        [user.id]: { ...draft, full_name: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Ad Soyad"
                  />
                  <input
                    value={draft.company_name}
                    onChange={(event) =>
                      setUserDrafts((old) => ({
                        ...old,
                        [user.id]: { ...draft, company_name: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Firma"
                  />
                  <input
                    type="password"
                    value={draft.password}
                    onChange={(event) =>
                      setUserDrafts((old) => ({
                        ...old,
                        [user.id]: { ...draft, password: event.target.value },
                      }))
                    }
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Yeni sifre (degistirmek istemezsen bos birak)"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => saveUser(user.id)}
                    disabled={busyKey === `user-${user.id}`}
                    className="rounded-full bg-[#ffd166] px-4 py-1.5 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
                  >
                    {busyKey === `user-${user.id}` ? "Kaydediliyor..." : "Kullaniciyi Kaydet"}
                  </button>
                  <p className="text-xs text-white/60">
                    Son guncelleme: {user.updated_at ? new Date(user.updated_at).toLocaleString("tr-TR") : "Henuz yok"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
