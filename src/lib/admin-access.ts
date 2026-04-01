import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
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
    if (userEmail && configuredAdmins.includes(userEmail)) {
      return {
        ok: true,
        status: 200,
        userId: user.id,
      };
    }

    return {
      ok: false,
      status: 500,
      error: "Profil rolu kontrol edilemedi.",
    };
  }

  const hasConfiguredAdminAccess = userEmail && configuredAdmins.includes(userEmail);

  if (profile?.role !== "admin" && !hasConfiguredAdminAccess) {
    const { count: adminCount, error: adminCountError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (!adminCountError && (adminCount ?? 0) === 0 && profile?.id) {
      const { error: promoteError } = await admin
        .from("profiles")
        .update({
          role: "admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (!promoteError) {
        return {
          ok: true,
          status: 200,
          userId: user.id,
        };
      }
    }
  }

  if (profile?.role !== "admin" && !hasConfiguredAdminAccess) {
    return {
      ok: false,
      status: 403,
      error: "Bu alan sadece admin kullanicilar icindir.",
    };
  }

  return {
    ok: true,
    status: 200,
    userId: user.id,
  };
}
