import { cva, type VariantProps } from "class-variance-authority";
import { ArrowLeftRight } from "lucide-react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

const exchangeBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        exchange: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      },
    },
    defaultVariants: {
      variant: "exchange",
    },
  }
);

interface ExchangeBadgeProps extends VariantProps<typeof exchangeBadgeVariants> {
  isExchange?: boolean;
  className?: string;
}

export function ExchangeBadge({ isExchange, className }: ExchangeBadgeProps) {
  if (!isExchange) return null;

  return (
    <span className={cn(exchangeBadgeVariants({ variant: "exchange", className }))}>
      <ArrowLeftRight className="h-3 w-3" />
      Takasa Açık
    </span>
  );
}

interface ExchangeOfferBadgeProps {
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  className?: string;
}

export function ExchangeOfferBadge({ status, className }: ExchangeOfferBadgeProps) {
  const config: Record<
    ExchangeOfferBadgeProps["status"],
    { label: string; variant: ExchangeBadgeProps["variant"] }
  > = {
    pending: { label: "Bekliyor", variant: "pending" },
    accepted: { label: "Kabul Edildi", variant: "accepted" },
    rejected: { label: "Reddedildi", variant: "rejected" },
    completed: { label: "Tamamlandı", variant: "completed" },
    cancelled: { label: "İptal", variant: "rejected" },
  };

  const { label, variant } = config[status];

  return <span className={cn(exchangeBadgeVariants({ variant, className }))}>{label}</span>;
}
