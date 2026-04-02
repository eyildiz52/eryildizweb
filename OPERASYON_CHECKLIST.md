# ER YILDIZ YAZILIM - Mini Operasyon Checklist

Bu dosya tek basina operasyon rehberidir.
Hedef: degisiklik yap, yayinla, dogrula, sorun olursa hizli toparla.

## 1) Kod Sonrasi Hemen Kontrol

1. Proje klasorune gir.
2. Build calistir.
3. Hata varsa once onu cozmeyi bitir.

Ornek:

   Set-Location "c:\Users\eryildiz\Desktop\ER YILDIZ YAZILIM\eryildizweb\firma-web"
   npm run build

## 2) Production Deploy

1. Projenin dogru Vercel projesine bagli oldugunu kontrol et.
2. Production deploy al.
3. Deploy URL ve aliaslari dogrula.

Ornek:

   npx vercel@latest link --yes --project eryildizweb --scope er-yildiz-yazilim
   npx vercel@latest --prod --yes --scope er-yildiz-yazilim
   npx vercel@latest inspect DEPLOY_OR_ALIAS_URL

## 3) Domain Dogrulama

1. Domainin dogru projeye bagli oldugunu kontrol et.
2. DNS ve 443 baglantisini kontrol et.

Ornek:

   npx vercel@latest domains inspect CUSTOM_DOMAIN
   Resolve-DnsName WWW_CUSTOM_DOMAIN -Type A
   Test-NetConnection WWW_CUSTOM_DOMAIN -Port 443
   curl.exe -I HTTPS_WWW_CUSTOM_DOMAIN

Beklenen:

- HTTP 200 OK
- Server: Vercel
- TcpTestSucceeded: True

## 4) Sadece Bu Bilgisayarda Acilmiyorsa (Chrome)

1. Site verilerini sil:
   - chrome://settings/content/all
   - eryildizyazilim.com ve vercel.app kayitlarini sil
2. DNS ve socket temizle:
   - chrome://net-internals/#dns -> Clear host cache
   - chrome://net-internals/#sockets -> Flush socket pools
3. Chrome'u tamamen kapatip ac.
4. Normal sekmede tekrar test et.

## 5) Storage Dosya Yonetimi (Admin Panel)

1. Yonetim paneli > Paket Yonetimi bolumune gir.
2. Mevcut Dosyayi Sil ile yanlis dosyayi kaldir.
3. Dosyayi Storage'a Yukle ile dogru dosyayi yukle.
4. Gerekirse Storage Bucket ve Storage Path alanlarini kaydet.

Not:

- Dosya yukleme tarayicidan dogrudan Supabase Storage'a gider.
- Yukleme bitince paketin indirme yolu otomatik guncellenir.

## 6) Hizli Teshis Sirasi (Sira Bozma)

1. npm run build
2. npx vercel --prod
3. npx vercel inspect DEPLOY_URL
4. domains inspect eryildizyazilim.com
5. Resolve-DnsName + Test-NetConnection + curl -I
6. Gerekirse Chrome cache/socket temizligi

## 7) Kirmizi Cizgi

- Build gecmeden production deploy'a devam etme.
- Domain baska projeye bagliysa deploy yanlis yerde gorunur.
- Gizli sekme calisiyor normal sekme calismiyorsa once tarayici cache tarafini temizle.
