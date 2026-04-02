import { fallbackPackages, fallbackVideos } from "./data/fallback";
import type { PlatformVideo, SoftwarePackage } from "./types";
import { getSupabaseAdminClient } from "./supabase/admin";

const SUPABASE_QUERY_TIMEOUT_MS = Number(process.env.SUPABASE_QUERY_TIMEOUT_MS ?? "4000");

const PLACEHOLDER_VIDEO_URLS = new Set([
  "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
]);
const OFFICIAL_VIDEO_URL = "https://www.youtube.com/watch?v=ARrIYQLSGVs";

async function runTimedQuery<T>(query: (signal: AbortSignal) => Promise<{ data: T | null; error: unknown }>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SUPABASE_QUERY_TIMEOUT_MS);

  try {
    const { data, error } = await query(controller.signal);

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizePackage(item: SoftwarePackage): SoftwarePackage {
  const sanitizedDemoUrl = sanitizeExternalUrl(item.demo_url);

  if (item.slug === "on-muhasebe-demo") {
    return {
      ...item,
      title: "Er Kaynak Log",
      short_description: "Celik, boru, kaynakci takibi ve laboratuvar NDT dokumanlarini merkezi yoneten izleme paketi.",
      long_description:
        "Kaynak operasyonlarinda celik ve boru lotlarini, kaynakci performansini, laboratuvar NDT kayitlarini ve denetim dokumanlarini izlenebilir bir yapiyla yonetin.",
      demo_url: sanitizedDemoUrl ?? OFFICIAL_VIDEO_URL,
    };
  }

  if (!sanitizedDemoUrl) {
    return item;
  }

  return {
    ...item,
    demo_url: sanitizedDemoUrl ?? OFFICIAL_VIDEO_URL,
  };
}

function normalizeVideo(item: PlatformVideo): PlatformVideo | null {
  const sanitizedVideoUrl = sanitizeExternalUrl(item.video_url);

  if (!sanitizedVideoUrl) {
    return {
      ...item,
      video_url: OFFICIAL_VIDEO_URL,
    };
  }

  if (PLACEHOLDER_VIDEO_URLS.has(sanitizedVideoUrl)) {
    return null;
  }

  return {
    ...item,
    video_url: sanitizedVideoUrl,
  };
}

export async function getActivePackages(): Promise<SoftwarePackage[]> {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return fallbackPackages.map(normalizePackage);
  }

  const data = await runTimedQuery<SoftwarePackage[]>(async (signal) =>
    await admin
      .from("software_packages")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .abortSignal(signal)
  );

  if (!data) {
    return fallbackPackages.map(normalizePackage);
  }

  return data.map(normalizePackage);
}

export async function getDemoPackages(): Promise<SoftwarePackage[]> {
  const all = await getActivePackages();
  return all.filter((item) => item.package_type === "demo");
}

export async function getPublishedVideos(): Promise<PlatformVideo[]> {
  const admin = getSupabaseAdminClient();
  const normalizedFallback = fallbackVideos
    .map(normalizeVideo)
    .filter((item): item is PlatformVideo => item !== null);

  if (!admin) {
    return normalizedFallback;
  }

  const data = await runTimedQuery<PlatformVideo[]>(async (signal) =>
    await admin
      .from("software_videos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .abortSignal(signal)
  );

  if (!data) {
    return normalizedFallback;
  }

  const normalized = data
    .map(normalizeVideo)
    .filter((item): item is PlatformVideo => item !== null);

  return normalized.length > 0 ? normalized : normalizedFallback;
}

export async function getPackageBySlug(slug: string): Promise<SoftwarePackage | null> {
  const all = await getActivePackages();
  return all.find((item) => item.slug === slug) ?? null;
}

export async function hasPaidAccess(userId: string, packageId: string): Promise<boolean> {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return false;
  }

  const data = await runTimedQuery<{ id: string }>(async (signal) =>
    await admin
      .from("orders")
      .select("id")
      .eq("user_id", userId)
      .eq("package_id", packageId)
      .eq("payment_status", "paid")
      .limit(1)
      .abortSignal(signal)
      .maybeSingle()
  );

  return Boolean(data?.id);
}
