import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { headers } from "next/headers";

import { RootProviders } from "@/components/providers/root-providers";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "OtoBurada — Sadece Araba İlan Pazaryeri",
    template: "%s | OtoBurada",
  },
  description:
    "Arabanı kolayca sat, doğru arabayı hızlıca bul. Türkiye'nin sadece arabalara özel, sade ve güvenilir ilan platformu.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OtoBurada — Araba Almanın ve Satmanın En Sade Yolu",
    description: "Sade, güvenilir ve mobil odaklı bir araba ilan pazaryeri deneyimi.",
    locale: "tr_TR",
    siteName: "OtoBurada",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OtoBurada",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OtoBurada — Araba İlan Pazaryeri",
    description: "Arabanı kolayca sat, doğru arabayı hızlıca bul.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OtoBurada",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/10 selection:text-primary">
        <RootProviders user={user} nonce={nonce}>
          {children}
          <Analytics />
          <SpeedInsights />
          <CookieConsent />
          <PWAInstallPrompt />
        </RootProviders>
      </body>
    </html>
  );
}
