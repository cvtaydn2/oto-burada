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
  let redirectTarget: string | null = null;

  if (!planId) {
    redirectTarget = "/dashboard/pricing";
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  const plans = await getAdminPricingPlans();
  const selectedPlan = plans.find((p) => p.id === planId);

  if (!selectedPlan) {
    redirectTarget = "/dashboard/pricing?plan=missing";
  }

  if (selectedPlan && !selectedPlan.is_active) {
    redirectTarget = "/dashboard/pricing?plan=inactive";
  }

  if (selectedPlan && !paymentEnabled && selectedPlan.price > 0) {
    redirectTarget = "/dashboard/pricing?payments=disabled";
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  if (!selectedPlan) {
    redirect("/dashboard/pricing");
  }

  return (
    <div className="container max-w-2xl py-12">
      <CheckoutClient plan={selectedPlan} isPaymentEnabled={paymentEnabled} />
    </div>
  );
}
