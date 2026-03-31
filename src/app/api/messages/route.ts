import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
};

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase public ortam degiskenleri eksik." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Mesajlar icin giris yapmaniz gerekiyor." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Mesaj servisi icin servis anahtari eksik." },
      { status: 503 }
    );
  }

  const [messagesRes, usersRes] = await Promise.all([
    admin
      .from("messages")
      .select("id,sender_id,receiver_id,body,created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("profiles").select("id,email,full_name").neq("id", user.id).limit(100),
  ]);

  if (messagesRes.error) {
    return NextResponse.json({ error: "Mesajlar getirilemedi." }, { status: 500 });
  }

  if (usersRes.error) {
    return NextResponse.json({ error: "Alici listesi getirilemedi." }, { status: 500 });
  }

  return NextResponse.json({
    messages: (messagesRes.data ?? []) as MessageRow[],
    receivers: (usersRes.data ?? []) as ProfileRow[],
    currentUserId: user.id,
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase public ortam degiskenleri eksik." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Mesaj icin giris yapmaniz gerekiyor." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Mesaj servisi icin servis anahtari eksik." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as { receiverId?: string; body?: string };
  if (!body.receiverId || !body.body?.trim()) {
    return NextResponse.json(
      { error: "receiverId ve body zorunludur." },
      { status: 400 }
    );
  }

  if (body.receiverId === user.id) {
    return NextResponse.json(
      { error: "Kendinize mesaj gonderemezsiniz." },
      { status: 400 }
    );
  }

  const { error } = await admin.from("messages").insert({
    sender_id: user.id,
    receiver_id: body.receiverId,
    body: body.body.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "Mesaj kaydedilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Mesaj gonderildi." });
}
