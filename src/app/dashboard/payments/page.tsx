import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

interface PaymentsPageProps {
  searchParams: Promise<{ status?: string; token?: string; message?: string }>;
}

export const metadata: Metadata = {
  title: "Ödeme Yönlendirmesi | OtoBurada Dashboard",
  description: "Ödeme sonucu sayfasına güvenli şekilde yönlendirilirsiniz.",
  alternates: {
    canonical: buildAbsoluteUrl("/dashboard/payments"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  await requireUser();

  const { status, token, message } = await searchParams;

  // Redirect to the result page, forwarding query params
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (token) params.set("token", token);
  if (message) params.set("message", message);

  redirect(`/dashboard/payments/result${params.size > 0 ? `?${params.toString()}` : ""}`);
}
