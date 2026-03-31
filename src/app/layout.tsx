import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eryildizyazilim.com"),
  title: "ER YILDIZ YAZILIM | Yazilim Paketleri ve Demolar",
  description:
    "Kurumsal yazilim paketleri, demo indirmeleri, video tanitim ve uye tabanli platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ER YILDIZ YAZILIM | Yazilim Paketleri ve Demolar",
    description:
      "Kurumsal yazilim paketleri, demo indirmeleri, video tanitim ve uye tabanli platform.",
    url: "https://eryildizyazilim.com",
    siteName: "ER YILDIZ YAZILIM",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/Simge.png",
        width: 512,
        height: 512,
        alt: "ER YILDIZ YAZILIM",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/Simge.ico", type: "image/x-icon" },
      { url: "/Simge.png", type: "image/png" },
    ],
    shortcut: "/Simge.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
