create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  company_name text,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists software_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  long_description text,
  package_type text not null check (package_type in ('demo', 'paid')),
  price numeric(12,2) not null default 0,
  currency text not null default 'TRY',
  storage_bucket text not null default 'software-files',
  storage_path text not null,
  demo_url text,
  thumbnail_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists software_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  video_url text not null,
  cover_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id uuid not null references software_packages (id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'TRY',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  package_id uuid not null references software_packages (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists contact_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  email text not null,
  phone text,
  project_type text,
  budget_range text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists email_logs (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'smtp',
  event_type text not null,
  recipient_email text,
  sender_email text,
  subject text,
  status text not null check (status in ('sent', 'failed', 'queued')),
  provider_message_id text,
  error_message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_software_packages_active
  on software_packages (is_active, created_at desc);
create index if not exists idx_orders_user_package
  on orders (user_id, package_id, payment_status);
create index if not exists idx_messages_participants
  on messages (sender_id, receiver_id, created_at desc);
create index if not exists idx_downloads_user
  on downloads (user_id, created_at desc);
create index if not exists idx_contact_requests_created_at
  on contact_requests (created_at desc);
create index if not exists idx_email_logs_created_at
  on email_logs (created_at desc);
create index if not exists idx_email_logs_status
  on email_logs (status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table software_packages enable row level security;
alter table software_videos enable row level security;
alter table orders enable row level security;
alter table downloads enable row level security;
alter table messages enable row level security;
alter table contact_requests enable row level security;
alter table email_logs enable row level security;

drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own"
on profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "packages_public_read" on software_packages;
create policy "packages_public_read"
on software_packages for select
to anon, authenticated
using (is_active = true);

drop policy if exists "videos_public_read" on software_videos;
create policy "videos_public_read"
on software_videos for select
to anon, authenticated
using (is_published = true);

drop policy if exists "orders_own_read" on orders;
create policy "orders_own_read"
on orders for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "orders_own_insert" on orders;
create policy "orders_own_insert"
on orders for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "downloads_own_read" on downloads;
create policy "downloads_own_read"
on downloads for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "downloads_own_insert" on downloads;
create policy "downloads_own_insert"
on downloads for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "messages_participants_read" on messages;
create policy "messages_participants_read"
on messages for select
to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_participants_insert" on messages;
create policy "messages_participants_insert"
on messages for insert
to authenticated
with check (auth.uid() = sender_id and sender_id <> receiver_id);

drop policy if exists "contact_insert_any" on contact_requests;
create policy "contact_insert_any"
on contact_requests for insert
to anon, authenticated
with check (true);

insert into software_packages (
  slug,
  title,
  short_description,
  long_description,
  package_type,
  price,
  currency,
  storage_bucket,
  storage_path,
  demo_url,
  is_active
)
values
  (
    'crm-lite',
    'CRM Lite',
    'Kucuk ekipler icin hizli musteri takibi.',
    'Teklif, gorev ve musteri notlarini tek panelde yonetirsiniz.',
    'paid',
    1490,
    'TRY',
    'software-files',
    'paid/crm-lite.zip',
    null,
    true
  ),
  (
    'stok-mini',
    'Stok Mini',
    'Basit stok giris-cikis ve raporlama.',
    'Kobi odakli stok takibi icin kolay kullanimli masaustu paket.',
    'paid',
    990,
    'TRY',
    'software-files',
    'paid/stok-mini.zip',
    null,
    true
  ),
  (
    'on-muhasebe-demo',
    'On Muhasebe Demo',
    'Ucretsiz indirilebilir deneme surumu.',
    'Fatura, cari ve kasa akislarini test etmek icin demo paket.',
    'demo',
    0,
    'TRY',
    'software-files',
    'demo/on-muhasebe-demo.zip',
    'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    true
  )
on conflict (slug) do nothing;

insert into software_videos (title, summary, video_url, is_published)
values
  (
    'CRM Lite 3 Dakikada',
    'Musteri karti, teklif ve gorev akislarini hizli tanitim videosu.',
    'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    true
  ),
  (
    'Stok Mini Kurulum',
    'Kurulum ve ilk stok karti acilisi adim adim anlatim.',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    true
  )
on conflict do nothing;
