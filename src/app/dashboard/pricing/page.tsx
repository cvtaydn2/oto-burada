import { PricingPlans } from "@/components/dashboard/pricing-plans";
import { getPricingPlans } from "@/services/admin/plans";

export const metadata = {
  title: "Üyelik Paketleri | OtoBurada",
  description: "Bireysel ve kurumsal üyelik paketleri ile ilanlarınızı öne çıkarın.",
};

export default async function PricingPage() {
  const plans = await getPricingPlans();
  
  return (
    <div className="container py-12">
      <PricingPlans initialPlans={plans} />
    </div>
  );
}
