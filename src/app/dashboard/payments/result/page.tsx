import type { Metadata } from "next";

import { buildAbsoluteUrl } from "@/features/seo/lib";

import { PaymentResultClientPage } from "./payment-result-client-page";

export const metadata: Metadata = {
  title: "Ödeme Sonucu | OtoBurada Dashboard",
  description:
    "Ödeme durumunuzu, paket sonucunu ve doğrulama akışını güvenli biçimde görüntüleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/payments/result"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentResultPage() {
  return <PaymentResultClientPage />;
}
