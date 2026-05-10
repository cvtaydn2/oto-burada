import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Paketler Yönlendirme | OtoBurada Dashboard",
  description: "Eski paketler rotası yeni fiyatlandırma yüzeyine yönlendirilir.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/paketler"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaketlerPage() {
  permanentRedirect("/dashboard/pricing");
}
