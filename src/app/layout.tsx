import type { Metadata } from "next";

import { AppProviders } from "@/components/shared/app-providers";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AppProviders userId={currentUser?.id ?? null}>{children}</AppProviders>
      </body>
    </html>
  );
}
