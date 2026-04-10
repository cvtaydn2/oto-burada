import type { Metadata } from "next";

import { AppProviders } from "@/components/shared/app-providers";
import { PWAInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { getCurrentUser } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/seo";

import "./globals.css";

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
  other: {
    "theme-color": "#4f46e5",
    "apple-mobile-web-app-capable": "yes",
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
    <html lang="tr" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <AppProviders userId={currentUser?.id ?? null}>
          {children}
          <PWAInstallPrompt />
        </AppProviders>
      </body>
    </html>
  );
}
