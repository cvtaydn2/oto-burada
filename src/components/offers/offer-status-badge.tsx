import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const offerBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        counter_offer: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        expired: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
        completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  }
);

interface OfferStatusBadgeProps extends VariantProps<typeof offerBadgeVariants> {
  status: string;
  className?: string;
}

export function OfferStatusBadge({ status, className }: OfferStatusBadgeProps) {
  const config: Record<string, { label: string; variant: OfferStatusBadgeProps["variant"] }> = {
    pending: { label: "Bekliyor", variant: "pending" },
    accepted: { label: "Kabul Edildi", variant: "accepted" },
    rejected: { label: "Reddedildi", variant: "rejected" },
    counter_offer: { label: "Karşı Teklif", variant: "counter_offer" },
    expired: { label: "Süresi Doldu", variant: "expired" },
    completed: { label: "Tamamlandı", variant: "completed" },
  };

  const { label, variant } = config[status] ?? { label: status, variant: "pending" };

  return <span className={cn(offerBadgeVariants({ variant, className }))}>{label}</span>;
}
