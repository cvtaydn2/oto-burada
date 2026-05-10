import type { Metadata } from "next";

import { buildAbsoluteUrl } from "@/features/seo/lib";

import { SentryExampleClientPage } from "./sentry-example-client";

export const metadata: Metadata = {
  title: "Sentry Örnek Sayfası | OtoBurada",
  description: "Sentry entegrasyonu ve örnek hata yakalama akışı için dahili test yüzeyi.",
  alternates: {
    canonical: buildAbsoluteUrl("/sentry-example-page"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SentryExamplePage() {
  return <SentryExampleClientPage />;
}
