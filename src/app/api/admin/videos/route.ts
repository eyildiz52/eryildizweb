import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const YOUTUBE_URL_REGEX = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}([&?].*)?$/i;

type VideoPayload = {
  id?: string;
  title?: string;
  summary?: string;
  videoUrl?: string;
  coverUrl?: string | null;
  isPublished?: boolean;
};

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalUrl(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function cleanYouTubeUrl(value: unknown): string | null {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  if (!YOUTUBE_URL_REGEX.test(text)) {
    return null;
  }

  return text;
}

export async function GET() {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  const { data, error } = await admin
    .from("software_videos")
    .select("id,title,summary,video_url,cover_url,is_published,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Videolar getirilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, videos: data ?? [] });
}

export async function POST(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: VideoPayload;
  try {
    payload = (await request.json()) as VideoPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const title = cleanText(payload.title);
  const summary = cleanText(payload.summary);
  const videoUrl = cleanYouTubeUrl(payload.videoUrl);
  const coverUrl = cleanOptionalUrl(payload.coverUrl);
  const isPublished = payload.isPublished === true;

  if (!title || !summary || !videoUrl) {
    return NextResponse.json(
      { error: "title, summary ve gecerli bir YouTube videoUrl zorunludur." },
      { status: 400 }
    );
  }

  if (isPublished) {
    await admin.from("software_videos").update({ is_published: false }).eq("is_published", true);
  }

  const { data, error } = await admin
    .from("software_videos")
    .insert({
      title,
      summary,
      video_url: videoUrl,
      cover_url: coverUrl,
      is_published: isPublished,
    })
    .select("id,title,summary,video_url,cover_url,is_published,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Video eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, video: data });
}

export async function PATCH(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: VideoPayload;
  try {
    payload = (await request.json()) as VideoPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const id = cleanText(payload.id);
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const updates: {
    title?: string;
    summary?: string;
    video_url?: string;
    cover_url?: string | null;
    is_published?: boolean;
  } = {};

  if (payload.title !== undefined) {
    const title = cleanText(payload.title);
    if (!title) {
      return NextResponse.json({ error: "title bos olamaz." }, { status: 400 });
    }
    updates.title = title;
  }

  if (payload.summary !== undefined) {
    const summary = cleanText(payload.summary);
    if (!summary) {
      return NextResponse.json({ error: "summary bos olamaz." }, { status: 400 });
    }
    updates.summary = summary;
  }

  if (payload.videoUrl !== undefined) {
    const url = cleanYouTubeUrl(payload.videoUrl);
    if (!url) {
      return NextResponse.json({ error: "videoUrl gecerli YouTube linki olmali." }, { status: 400 });
    }
    updates.video_url = url;
  }

  if (payload.coverUrl !== undefined) {
    updates.cover_url = cleanOptionalUrl(payload.coverUrl);
  }

  if (payload.isPublished !== undefined) {
    updates.is_published = payload.isPublished === true;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Guncelleme alani yok." }, { status: 400 });
  }

  if (updates.is_published === true) {
    await admin
      .from("software_videos")
      .update({ is_published: false })
      .neq("id", id)
      .eq("is_published", true);
  }

  const { data, error } = await admin
    .from("software_videos")
    .update(updates)
    .eq("id", id)
    .select("id,title,summary,video_url,cover_url,is_published,created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Video guncellenemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, video: data });
}

export async function DELETE(request: Request) {
  const access = await requireAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servis anahtari eksik." }, { status: 503 });
  }

  let payload: VideoPayload;
  try {
    payload = (await request.json()) as VideoPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const id = cleanText(payload.id);
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const { error } = await admin.from("software_videos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Video silinemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
