import { redirect } from "next/navigation";

import { CheckoutClient } from "@/components/dashboard/checkout-client";
import { requireUser } from "@/lib/auth/session";
import { isPaymentEnabled } from "@/lib/payment/config";
import { getAdminPricingPlans } from "@/services/admin/plans";

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export const metadata = {
  title: "Ödeme | OtoBurada",
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  await requireUser();

  const { plan: planId } = await searchParams;
  const paymentEnabled = isPaymentEnabled();

  if (!planId) {
    redirect("/dashboard/pricing");
  }

  const plans = await getAdminPricingPlans();
  const selectedPlan = plans.find((p) => p.id === planId);

  if (!selectedPlan) {
    redirect("/dashboard/pricing?plan=missing");
  }

  if (!selectedPlan.is_active) {
    redirect("/dashboard/pricing?plan=inactive");
  }

  if (!paymentEnabled && selectedPlan.price > 0) {
    redirect("/dashboard/pricing?payments=disabled");
  }

  return (
    <div className="container max-w-2xl py-12">
      <CheckoutClient plan={selectedPlan} isPaymentEnabled={paymentEnabled} />
    </div>
  );
}
