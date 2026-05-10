import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Yeni İlan Yönlendirmesi | OtoBurada Dashboard",
  description: "Yeni ilan oluşturma akışı ilan yönetimi sayfasına yönlendirilir.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/listings/create"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardListingCreateRedirectPage() {
  redirect("/dashboard/listings?create=true");
}
