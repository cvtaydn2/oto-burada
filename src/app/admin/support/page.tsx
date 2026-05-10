import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Admin Destek Yönlendirmesi | OtoBurada",
  description: "Eski admin destek rotası ticket yönetim yüzeyine yönlendirilir.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/support"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSupportRedirect() {
  permanentRedirect("/admin/tickets");
}
