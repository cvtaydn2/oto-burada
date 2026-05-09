import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { headers } from "next/headers";

import { LazyClientWidgets } from "@/components/shared/lazy-client-widgets";
import { getCurrentUser } from "@/features/auth/lib/session";
import { RootProviders } from "@/features/providers/components/root-providers";
import { getAppUrl } from "@/features/seo/lib";

// Default behavior is preferred for better performance and Speed Insights
// Individual pages should define their dynamic behavior if needed

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
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  const csrfToken = headersList.get("x-csrf-token") ?? undefined;
  const isProd = process.env.NODE_ENV === "production";
  const analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS !== "false";
  const speedInsightsEnabled = process.env.NEXT_PUBLIC_ENABLE_VERCEL_SPEED_INSIGHTS !== "false";

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${outfit.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <meta name="csrf-token" content={csrfToken} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin} />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/10 selection:text-primary">
        <RootProviders user={user} nonce={nonce}>
          {children}
          {isProd && analyticsEnabled ? <Analytics /> : null}
          {isProd && speedInsightsEnabled ? <SpeedInsights /> : null}
          <LazyClientWidgets />
        </RootProviders>
      </body>
    </html>
  );
}
