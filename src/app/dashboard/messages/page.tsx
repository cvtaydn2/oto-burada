import type { Metadata } from "next";

import { buildAbsoluteUrl } from "@/features/seo/lib";

import { MessagesClientPage } from "./messages-client-page";

export const metadata: Metadata = {
  title: "Mesajlar | OtoBurada Dashboard",
  description:
    "Araç sahipleri ve alıcılarla yaptığınız tüm görüşmeleri tek ekran üzerinden yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/messages"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MessagesPage() {
  return <MessagesClientPage />;
}
