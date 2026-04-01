import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-access";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type UserPatchPayload = {
  id?: string;
  email?: string;
  fullName?: string | null;
  companyName?: string | null;
  role?: string;
  password?: string;
};

const MIN_ADMIN_SET_PASSWORD_LENGTH = 8;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanOptionalText(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  return cleanText(value);
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
    .from("profiles")
    .select("id,email,full_name,company_name,role,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Kullanicilar getirilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, users: data ?? [] });
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

  let payload: UserPatchPayload;
  try {
    payload = (await request.json()) as UserPatchPayload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const id = cleanText(payload.id);
  if (!id) {
    return NextResponse.json({ error: "id zorunludur." }, { status: 400 });
  }

  const profileUpdates: {
    email?: string;
    full_name?: string | null;
    company_name?: string | null;
    role?: string;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  let shouldUpdateProfile = false;
  let emailForAuth: string | null = null;
  let passwordForAuth: string | null = null;

  if (payload.email !== undefined) {
    const email = cleanText(payload.email)?.toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Gecerli bir e-posta girin." }, { status: 400 });
    }
    profileUpdates.email = email;
    emailForAuth = email;
    shouldUpdateProfile = true;
  }

  if (payload.fullName !== undefined) {
    profileUpdates.full_name = cleanOptionalText(payload.fullName);
    shouldUpdateProfile = true;
  }

  if (payload.companyName !== undefined) {
    profileUpdates.company_name = cleanOptionalText(payload.companyName);
    shouldUpdateProfile = true;
  }

  if (payload.role !== undefined) {
    const role = cleanText(payload.role)?.toLowerCase();
    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "role sadece admin veya member olabilir." }, { status: 400 });
    }
    profileUpdates.role = role;
    shouldUpdateProfile = true;
  }

  if (payload.password !== undefined) {
    const password = cleanText(payload.password);
    if (!password || password.length < MIN_ADMIN_SET_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Yeni sifre en az ${MIN_ADMIN_SET_PASSWORD_LENGTH} karakter olmali.` },
        { status: 400 }
      );
    }
    passwordForAuth = password;
  }

  if (!shouldUpdateProfile && !emailForAuth && !passwordForAuth) {
    return NextResponse.json({ error: "Guncelleme alani yok." }, { status: 400 });
  }

  if (emailForAuth || passwordForAuth) {
    const authPayload: { email?: string; password?: string; email_confirm?: boolean } = {};

    if (emailForAuth) {
      authPayload.email = emailForAuth;
      authPayload.email_confirm = true;
    }

    if (passwordForAuth) {
      authPayload.password = passwordForAuth;
    }

    const { error: authError } = await admin.auth.admin.updateUserById(id, authPayload);

    if (authError) {
      return NextResponse.json({ error: `Auth kullanicisi guncellenemedi: ${authError.message}` }, { status: 500 });
    }
  }

  if (shouldUpdateProfile) {
    const { error: profileError } = await admin
      .from("profiles")
      .update(profileUpdates)
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: "Profil guncellenemedi." }, { status: 500 });
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,company_name,role,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Guncel kullanici bilgisi alinamadi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: data });
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

  let payload: {
    email?: string;
    password?: string;
    role?: string;
    fullName?: string;
    companyName?: string;
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Gecersiz JSON." }, { status: 400 });
  }

  const email = cleanText(payload.email)?.toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Gecerli bir e-posta girin." }, { status: 400 });
  }

  const password = cleanText(payload.password);
  if (!password || password.length < MIN_ADMIN_SET_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Sifre en az ${MIN_ADMIN_SET_PASSWORD_LENGTH} karakter olmali.` },
      { status: 400 }
    );
  }

  const role = cleanText(payload.role)?.toLowerCase() ?? "member";
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "role sadece admin veya member olabilir." }, { status: 400 });
  }

  let userId: string | null = null;

  const { data: listedUsers, error: listUsersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listUsersError) {
    return NextResponse.json(
      { error: `Kullanici listesi alinamadi: ${listUsersError.message}` },
      { status: 500 }
    );
  }

  const existingAuthUser = (listedUsers.users ?? []).find(
    (item) => (item.email ?? "").trim().toLowerCase() === email
  );

  if (existingAuthUser?.id) {
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(existingAuthUser.id, {
      email,
      password,
      email_confirm: true,
    });

    if (updateAuthError) {
      return NextResponse.json(
        { error: `Mevcut kullanici guncellenemedi: ${updateAuthError.message}` },
        { status: 500 }
      );
    }

    userId = existingAuthUser.id;
  } else {
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: `Kullanici olusturulamadi: ${authError.message}` },
        { status: 500 }
      );
    }

    userId = authData.user.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Kullanici kimligi olusturulamadi." }, { status: 500 });
  }

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: cleanOptionalText(payload.fullName) ?? null,
    company_name: cleanOptionalText(payload.companyName) ?? null,
    role,
    updated_at: new Date().toISOString(),
  });

  const { data, error } = await admin
    .from("profiles")
    .select("id,email,full_name,company_name,role,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Kullanici bilgisi alinamadi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: data }, { status: 201 });
}
