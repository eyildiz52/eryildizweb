import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Kalici admin e-postalar — DB ve env var'dan bagimsiz calisir
const HARDCODED_ADMINS = ["erdoganyildiz52@gmail.com", "erdogan.yildiz@eryildizyazilim.com"];

function getConfiguredAdminEmails() {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...HARDCODED_ADMINS, ...fromEnv])];
}

type AdminAccessResult = {
  ok: boolean;
  status: number;
  error?: string;
  userId?: string;
};

export async function requireAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Supabase public ortam degiskenleri eksik.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      status: 401,
      error: "Yonetim alani icin giris yapmaniz gerekiyor.",
    };
  }

  const userEmail = (user.email ?? "").trim().toLowerCase();
  const configuredAdmins = getConfiguredAdminEmails();

  // ADMIN_EMAILS env var'da varsa profil tablosuna gerek yok — direkt izin ver
  if (userEmail && configuredAdmins.includes(userEmail)) {
    return { ok: true, status: 200, userId: user.id };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      error: "Servis anahtari eksik.",
    };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      status: 500,
      error: "Profil rolu kontrol edilemedi.",
    };
  }

  // Profil var ve admin — izin ver
  if (profile?.role === "admin") {
    return { ok: true, status: 200, userId: user.id };
  }

  // Sistemde hiç admin yoksa ilk gelen kullaniciyi admin yap (profil satiri olsun olmasin)
  const { count: adminCount, error: adminCountError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (!adminCountError && (adminCount ?? 0) === 0) {
    // Profil satiri yoksa once olustur
    await admin.from("profiles").upsert({
      id: user.id,
      email: userEmail,
      role: "admin",
      updated_at: new Date().toISOString(),
    });

    return { ok: true, status: 200, userId: user.id };
  }

  return {
    ok: false,
    status: 403,
    error: "Bu alan sadece admin kullanicilar icindir.",
  };
}
