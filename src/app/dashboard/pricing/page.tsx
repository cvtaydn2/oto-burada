import { PricingPlans } from "@/components/dashboard/pricing-plans";

export const metadata = {
  title: "Üyelik Paketleri | OtoBurada",
  description: "Bireysel ve kurumsal üyelik paketleri ile ilanlarınızı öne çıkarın.",
};

export default function PricingPage() {
  return (
    <div className="container py-6">
      <PricingPlans />
    </div>
  );
}
