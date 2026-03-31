# ER YILDIZ YAZILIM - Yazilim Platformu

Bu proje yazilim paketleri satabileceginiz, demolari dagitabildiginiz, videolar yayinlayabildiginiz ve uyeler arasi mesajlasma sunan bir Next.js + Supabase platformudur.

## Ozellikler

- Uye kaydi ve giris
- Ucretli/uygulama paket listesi
- Demo paketlerin acik indirilmesi
- Ucretli paketlerde odeme onayi olmadan indirme engeli
- Tanitim video galerisi
- Uyeler arasi ozel mesajlasma

## Teknoloji

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + Database + Storage)

## Kurulum

1. Bagimliliklari yukleyin:
   - npm install
2. Ortam degiskenlerini hazirlayin:
   - Windows PowerShell: Copy-Item .env.local.example .env.local
3. .env.local icine su degerleri girin:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_APP_URL
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET
   - SMTP_HOST
   - SMTP_PORT
   - SMTP_SECURE
   - SMTP_USER
   - SMTP_PASS
   - SMTP_FROM_EMAIL
   - SALES_INBOX_EMAIL
4. Supabase SQL Editor'da supabase/schema.sql dosyasini calistirin.
5. Supabase Storage tarafinda software-files adli bucket olusturun.
6. Gelistirme sunucusunu baslatin:
   - npm run dev
7. Stripe webhook dinlemek icin (lokalde):
   - stripe listen --forward-to localhost:3000/api/payments/webhook
   - Komuttan gelen `whsec_...` degerini STRIPE_WEBHOOK_SECRET olarak yazin.

## Canli Alan Adi

- Uretim adresi: [https://eryildizyazilim.com](https://eryildizyazilim.com)
- Uretimde `NEXT_PUBLIC_APP_URL` degeri bu alan adi olmalidir.
- Stripe Dashboard webhook endpointi: [https://eryildizyazilim.com/api/payments/webhook](https://eryildizyazilim.com/api/payments/webhook)

## Domain E-posta Entegrasyonu

- Iletisim formu kaydi once `contact_requests` tablosuna yazilir.
- Ardindan SMTP ile `SALES_INBOX_EMAIL` adresine otomatik bildirim e-postasi gonderilir.
- Gonderim sonucu `email_logs` tablosuna `sent` veya `failed` olarak kaydedilir.
- `SMTP_FROM_EMAIL` veya `SALES_INBOX_EMAIL` bos birakilsa bile sistem varsayilan olarak `SMTP_USER` adresini kullanir.
- `supabase/schema.sql` dosyasini tekrar calistirarak `email_logs` tablosunu olusturun.

## Odeme Akisi (Stripe)

- Ucretli pakette Satin Alma butonu Stripe Checkout oturumu olusturur.
- Siparis satiri `pending` olarak kaydedilir ve `payment_reference` alanina Stripe session id yazilir.
- Stripe, `/api/payments/webhook` endpointine `checkout.session.completed` gonderdiginde siparis `paid` olur.
- `checkout.session.expired` eventinde siparis `failed` olur.
- Indirme route'u sadece `paid` siparis varsa signed URL dondurur.

## Kritik Not

- SUPABASE_SERVICE_ROLE_KEY sadece sunucuda kullanilmalidir.
- Bu anahtari istemci tarafina expose etmeyin.
