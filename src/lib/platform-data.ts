import { fallbackPackages, fallbackVideos } from "./data/fallback";
import type { PlatformVideo, SoftwarePackage } from "./types";
import { getSupabaseAdminClient } from "./supabase/admin";

export async function getActivePackages(): Promise<SoftwarePackage[]> {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return fallbackPackages;
  }

  const { data, error } = await admin
    .from("software_packages")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return fallbackPackages;
  }

  return data;
}

export async function getDemoPackages(): Promise<SoftwarePackage[]> {
  const all = await getActivePackages();
  return all.filter((item) => item.package_type === "demo");
}

export async function getPublishedVideos(): Promise<PlatformVideo[]> {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return fallbackVideos;
  }

  const { data, error } = await admin
    .from("software_videos")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return fallbackVideos;
  }

  return data;
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
