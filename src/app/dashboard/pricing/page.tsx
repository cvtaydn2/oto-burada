import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { PricingPlans } from "@/components/dashboard/pricing-plans";
import { isPaymentEnabled } from "@/lib/payment/config";
import { getPublicPricingPlans } from "@/services/admin/plans";

export const metadata = {
  title: "Üyelik Paketleri | OtoBurada",
  description: "Bireysel ve kurumsal üyelik paketleri ile ilanlarınızı öne çıkarın.",
};

interface PricingPageProps {
  searchParams?: Promise<{ plan?: string; payments?: string }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = (await searchParams) ?? {};
  const plans = await getPublicPricingPlans();
  const paymentEnabled = isPaymentEnabled();
  const visiblePlans = paymentEnabled ? plans : plans.filter((plan) => plan.price === 0);
  const planStateMessage =
    params.plan === "inactive"
      ? "Seçtiğiniz paket şu anda satışta değil."
      : params.plan === "missing"
        ? "Seçtiğiniz paket bulunamadı."
        : params.payments === "disabled"
          ? "Ücretli paket satın alma geçici olarak kapalı."
          : null;

  return (
    <div className="container py-12">
      {planStateMessage && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle size={16} />
            {planStateMessage}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Güncel olarak satın alınabilir paketleri aşağıda görebilirsiniz.
          </p>
        </div>
      )}
      {!paymentEnabled && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle size={16} />
            Ödeme sistemi şu anda kapalı.
          </div>
          <p className="mt-2 text-sm">
            Ücretli paket satın alma geçici olarak devre dışı. Sadece ücretsiz seçenekler
            gösteriliyor. Yardım için{" "}
            <Link href="/contact" className="underline">
              iletişime geçin
            </Link>
            .
          </p>
        </div>
      )}
      <PricingPlans initialPlans={visiblePlans} />
    </div>
  );
}
