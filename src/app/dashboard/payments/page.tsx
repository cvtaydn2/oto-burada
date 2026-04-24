import { redirect } from "next/navigation";

interface PaymentsPageProps {
  searchParams: Promise<{ status?: string; token?: string }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const { status, token } = await searchParams;

  // Redirect to the result page, forwarding query params
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (token) params.set("token", token);

  redirect(`/dashboard/payments/result${params.size > 0 ? `?${params.toString()}` : ""}`);
}
