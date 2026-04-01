import { fallbackPackages, fallbackVideos } from "./data/fallback";
import type { PlatformVideo, SoftwarePackage } from "./types";
import { getSupabaseAdminClient } from "./supabase/admin";

const PLACEHOLDER_VIDEO_URLS = new Set([
  "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
]);
const OFFICIAL_VIDEO_URL = "https://www.youtube.com/watch?v=ARrIYQLSGVs";

function normalizePackage(item: SoftwarePackage): SoftwarePackage {
  if (
    item.slug === "on-muhasebe-demo" &&
    item.demo_url &&
    PLACEHOLDER_VIDEO_URLS.has(item.demo_url)
  ) {
    return {
      ...item,
      demo_url: OFFICIAL_VIDEO_URL,
    };
  }

  return item;
}

function normalizeVideo(item: PlatformVideo): PlatformVideo | null {
  if (PLACEHOLDER_VIDEO_URLS.has(item.video_url)) {
    return null;
  }

  return item;
}

export async function getActivePackages(): Promise<SoftwarePackage[]> {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return fallbackPackages.map(normalizePackage);
  }

  const { data, error } = await admin
    .from("software_packages")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
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

  if (!admin) {
    return fallbackVideos
      .map(normalizeVideo)
      .filter((item): item is PlatformVideo => item !== null);
  }

  const { data, error } = await admin
    .from("software_videos")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return fallbackVideos
      .map(normalizeVideo)
      .filter((item): item is PlatformVideo => item !== null);
  }

  return data
    .map(normalizeVideo)
    .filter((item): item is PlatformVideo => item !== null);
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

  const { data, error } = await admin
    .from("orders")
    .select("id")
    .eq("user_id", userId)
    .eq("package_id", packageId)
    .eq("payment_status", "paid")
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data?.id);
}
