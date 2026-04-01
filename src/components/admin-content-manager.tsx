"use client";

import { useMemo, useState } from "react";

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

type Props = {
  initialVideos: AdminVideo[];
  initialPackages: AdminPackage[];
  initialUsers: AdminUser[];
};

type DraftVideo = {
  title: string;
  summary: string;
  video_url: string;
  cover_url: string;
  is_published: boolean;
};

type DraftPackage = {
  title: string;
  short_description: string;
  long_description: string;
  price: string;
  currency: string;
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
    title: item.title,
    short_description: item.short_description,
    long_description: item.long_description ?? "",
    price: String(item.price),
    currency: item.currency,
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

export function AdminContentManager({ initialVideos, initialPackages, initialUsers }: Props) {
  const [videos, setVideos] = useState<AdminVideo[]>(initialVideos);
  const [packages, setPackages] = useState<AdminPackage[]>(initialPackages);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [videoDrafts, setVideoDrafts] = useState<Record<string, DraftVideo>>(() => {
    const entries = initialVideos.map((video) => [video.id, toDraftVideo(video)] as const);
    return Object.fromEntries(entries);
  });
  const [packageDrafts, setPackageDrafts] = useState<Record<string, DraftPackage>>(() => {
    const entries = initialPackages.map((item) => [item.id, toDraftPackage(item)] as const);
    return Object.fromEntries(entries);
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

  const publishedCount = useMemo(
    () => videos.filter((item) => item.is_published).length,
    [videos]
  );
  const adminCount = useMemo(
    () => users.filter((item) => item.role === "admin").length,
    [users]
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

  const savePackage = async (id: string) => {
    const draft = packageDrafts[id];
    if (!draft) {
      return;
    }

    setBusyKey(`package-${id}`);
    try {
      const res = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: draft.title,
          shortDescription: draft.short_description,
          longDescription: draft.long_description,
          price: Number(draft.price),
          currency: draft.currency,
          demoUrl: draft.demo_url,
          isActive: draft.is_active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Paket guncellenemedi.");
      }

      await refreshPackages();
      writeMessage("Paket guncellendi.");
    } catch (error) {
      writeMessage(error instanceof Error ? error.message : "Paket guncellenemedi.");
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
    if (newUser.password.trim().length < 3) {
      writeMessage("Sifre en az 3 karakter olmali.");
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
        <div className="mt-4 space-y-4">
          {packages.map((item) => {
            const draft = packageDrafts[item.id] ?? toDraftPackage(item);
            return (
              <article key={item.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs text-white/60">{item.slug} • {item.package_type.toUpperCase()}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <input
                    aria-label={`${item.slug} paket basligi`}
                    value={draft.title}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, title: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} para birimi`}
                    value={draft.currency}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, currency: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} kisa aciklama`}
                    value={draft.short_description}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, short_description: event.target.value },
                      }))
                    }
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <textarea
                    aria-label={`${item.slug} uzun aciklama`}
                    value={draft.long_description}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, long_description: event.target.value },
                      }))
                    }
                    rows={3}
                    className="md:col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    aria-label={`${item.slug} fiyat`}
                    value={draft.price}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, price: event.target.value },
                      }))
                    }
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                  <input
                    value={draft.demo_url}
                    onChange={(event) =>
                      setPackageDrafts((old) => ({
                        ...old,
                        [item.id]: { ...draft, demo_url: event.target.value },
                      }))
                    }
                    placeholder="Demo URL"
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(event) =>
                        setPackageDrafts((old) => ({
                          ...old,
                          [item.id]: { ...draft, is_active: event.target.checked },
                        }))
                      }
                    />
                    Paket aktif
                  </label>
                  <button
                    onClick={() => savePackage(item.id)}
                    disabled={busyKey === `package-${item.id}`}
                    className="rounded-full bg-[#ffd166] px-4 py-1.5 text-xs font-semibold text-[#1f2937] disabled:opacity-60"
                  >
                    Kaydet
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
                placeholder="Sifre * (en az 3 karakter)"
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
