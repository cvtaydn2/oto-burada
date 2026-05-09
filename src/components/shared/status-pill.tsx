import {
  getTrustDotColor,
  getTrustStyles,
  type TrustTone,
} from "@/features/marketplace/lib/trust-ui";
import {} from "@/lib";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  label: string;
  tone?: TrustTone;
  className?: string;
  showDot?: boolean;
}

export function StatusPill({ label, tone = "amber", className, showDot = false }: StatusPillProps) {
  const styles = getTrustStyles(tone);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border",
        styles,
        className
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", getTrustDotColor(tone))} />}
      {label}
    </span>
  );
}
