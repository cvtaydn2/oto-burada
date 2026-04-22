import type { Metadata } from "next";
import { headers } from "next/headers";

import { RootProviders } from "@/components/providers/root-providers";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { getAppUrl } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth/session";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "Oto Burada",
    template: "%s | Oto Burada",
  },
  description:
    "Sade, güvenilir ve mobil odaklı bir araba ilan pazaryeri deneyimi.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    description: "Sade, güvenilir ve mobil odaklı bir araba ilan pazaryeri deneyimi.",
    locale: "tr_TR",
    siteName: "Oto Burada",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "theme-color": "#4f46e5",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${outfit.variable} h-full antialiased font-sans`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        {/* Supabase storage is dynamic based on project ID, but we can hint the main pattern if known or just fallback */}
      </head>
      <body className="min-h-full bg-background text-foreground selection:bg-primary/10 selection:text-primary">
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
