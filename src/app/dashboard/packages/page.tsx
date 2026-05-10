import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Paketler Yönlendirme | OtoBurada Dashboard",
  description: "Paketler sayfası yeni fiyatlandırma yüzeyine yönlendirilir.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/packages"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PackagesPage() {
  permanentRedirect("/dashboard/pricing");
}
