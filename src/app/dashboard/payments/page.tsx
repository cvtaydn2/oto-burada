import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";

interface PaymentsPageProps {
  searchParams: Promise<{ status?: string; token?: string; message?: string }>;
}

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
