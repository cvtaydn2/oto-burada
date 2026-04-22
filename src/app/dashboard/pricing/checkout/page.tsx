import { redirect } from "next/navigation";

import { CheckoutClient } from "@/components/dashboard/checkout-client";
import { requireUser } from "@/lib/auth/session";
import { isPaymentEnabled } from "@/lib/payment/config";
import { getPricingPlans } from "@/services/admin/plans";

interface CheckoutPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export const metadata = {
  title: "Ödeme | OtoBurada",
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  await requireUser();

  const { plan: planId } = await searchParams;

  if (!planId) {
    redirect("/dashboard/pricing");
  }

  const plans = await getPricingPlans();
  const selectedPlan = plans.find((p) => p.id === planId);

  if (!selectedPlan) {
    redirect("/dashboard/pricing");
  }

  return (
    <div className="container max-w-2xl py-12">
      <CheckoutClient plan={selectedPlan} isPaymentEnabled={isPaymentEnabled()} />
    </div>
  );
}
