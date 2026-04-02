export const homepageProofPoints = [
  {
    title: "Kuruluma Hazir Paketler",
    text: "Proje yonetimi ve on muhasebe odakli urunleri tek vitrinde sergileyip dogrudan talep toplayin.",
  },
  {
    title: "Odeme Sonrasi Kontrollu Teslim",
    text: "Ucretli dosyalar sadece onaylanan siparislerde acilir; manuel odeme senaryosu sisteme dahildir.",
  },
  {
    title: "Demo ve Video Destegi",
    text: "Ziyaretci satin almadan once urunu gorebilir, videodan inceleyebilir ve dogru pakete yonlenir.",
  },
];

export const purchaseFlowSteps = [
  {
    step: "01",
    title: "Paketi Sec",
    text: "Ihtiyaca gore demo veya ucretli paketi secin, icerigi ve hedef kullanim alanini inceleyin.",
  },
  {
    step: "02",
    title: "Odeme veya Talep",
    text: "Manuel odeme bilgisini alin ya da sonraki asamada PayTR ile odemeyi dogrudan tamamlayin.",
  },
  {
    step: "03",
    title: "Indir ve Kur",
    text: "Odeme onayi tamamlandiginda indirme otomatik acilir, demo paketler aninda teslim edilir.",
  },
];

export const trustHighlights = [
  "Uye girisi ve siparis takibi tek hesapta ilerler.",
  "Indirme linkleri dogrudan herkese acilmaz; siparis durumuna gore yonetilir.",
  "Demo, video ve iletisim akisi ayni platformda birlesir.",
  "Kucuk ekipler icin gereksiz karmasa olmadan hizli satis vitrini sunar.",
];

export const homepageFaq = [
  {
    question: "Paket satin alindiginda teslimat nasil oluyor?",
    answer:
      "Ucretli paketlerde odeme onayi tamamlandiginda indirme erisimi acilir. Demo paketler ise dogrudan indirilebilir.",
  },
  {
    question: "Kurumsal ihtiyaca gore demo izleme imkani var mi?",
    answer:
      "Evet. Demo sayfasi ve video vitrini birlikte kullanilarak satin alma oncesi guven olusturulur.",
  },
  {
    question: "Bu sistem sadece dijital urun satisi icin mi uygun?",
    answer:
      "Ana akisi yazilim paketi satisi icin tasarlandi; demo dagitimi, video tanitimi ve uyelik tabanli teslimat odaklidir.",
  },
];

export const demosPageHighlights = [
  "Demo paketler satin alma oncesi guven olusturur.",
  "Kullanicinin ekrani gormeden karar vermesini beklemezsiniz.",
  "Video ve demo birlikte kullanildiginda donusum kalitesi artar.",
];

export const videosPageHighlights = [
  {
    title: "Hizli Tanitim",
    text: "Ilk ziyaretciye urunun ne is yaptigini dakikalar icinde anlatin.",
  },
  {
    title: "Guven Kurulumu",
    text: "Satinalma karari oncesi ekranlari ve akis mantigini gosterin.",
  },
  {
    title: "Destek Yukunu Azaltma",
    text: "Sik sorulan kullanim adimlarini video ile onceden cevaplayin.",
  },
];

type PackageMarketingContent = {
  badge: string;
  idealFor: string;
  valueLine: string;
  highlights: string[];
};

const packageMarketingBySlug: Record<string, PackageMarketingContent> = {
  "crm-lite": {
    badge: "Insaat Proje Yonetimi",
    idealFor: "Insaat projelerinde planlama, saha ve yonetim ekiplerini ortak akista bulusturmak isteyen firmalar",
    valueLine: "Insaat projelerinin tum departmanlarini kapsayan merkezi yonetim yapisiyla surec takibini tek ekranda toplayin.",
    highlights: [
      "Proje bazli departman koordinasyonu",
      "Saha ilerleme ve is kalemi takibi",
      "Yonetsel raporlama ve durum gorunurlugu",
    ],
  },
  "stok-mini": {
    badge: "Proje Yonetimi Mini",
    idealFor: "Insaat projelerinde temel planlama ve takip ihtiyacini daha yalın bir paketle yonetmek isteyen ekipler",
    valueLine: "Er Proje Yonetimi Mini ile proje akisinin ana adimlarini hizli kurup ekip uyumunu kaybetmeden ilerleyin.",
    highlights: [
      "Temel proje planlama ve gorev takibi",
      "Sahadan hizli durum guncellemesi",
      "Yalın ve hizli devreye alma yapisi",
    ],
  },
  "er-kaynak-log": {
    badge: "Kaynak ve NDT Log Yonetimi",
    idealFor: "Celik, boru, kaynakci ve laboratuvar NDT dokuman takibini denetlenebilir sekilde yonetmek isteyen firmalar",
    valueLine: "Er Kaynak Log ile uretim ve kalite tarafindaki kritik kaynak kayitlarini tek havuzda izlenebilir hale getirin.",
    highlights: [
      "Celik ve boru lot bazli takip",
      "Kaynakci performans ve islem kayitlari",
      "Laboratuvar NDT ve denetim dokuman yonetimi",
    ],
  },
  "on-muhasebe-demo": {
    badge: "On Muhasebe Deneyimi",
    idealFor: "Cari, fatura ve kasa akislarini satin alma oncesi test etmek isteyenler",
    valueLine: "Demo surum ile ekran yapisini, is akislarini ve temel kullanim hissini risksiz inceleyin.",
    highlights: [
      "Cari ve tahsilat akislarini gorun",
      "Fatura ve kasa senaryolarini test edin",
      "Urunu inceleyip satin almaya karar verin",
    ],
  },
};

export function getPackageMarketingContent(slug: string, title: string): PackageMarketingContent {
  return (
    packageMarketingBySlug[slug] ?? {
      badge: "Yazilim Paketi",
      idealFor: "Dijital urununu kontrollu sekilde sunmak isteyen ekipler",
      valueLine: `${title} paketi icin ozel tanitim metni eklendiginde bu alan otomatik olarak guclendirilebilir.`,
      highlights: ["Kurulum dosyasi", "Kontrollu teslimat", "Uye tabanli erisim"],
    }
  );
}