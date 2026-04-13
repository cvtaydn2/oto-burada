import type { Metadata } from "next";

import { AppProviders } from "@/components/shared/app-providers";
import { CookieConsent } from "@/components/shared/cookie-consent";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/seo";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
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
    icon: "/icons/icon-32x32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
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
  const currentUser = await getCurrentUser();

  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable} h-full antialiased font-sans`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground selection:bg-primary/10 selection:text-primary">
        <AppProviders userId={currentUser?.id ?? null}>
          {children}
          <CookieConsent />
          <PWAInstallPrompt />
          <Analytics />
          <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
