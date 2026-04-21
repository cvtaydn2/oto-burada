import { cn } from "@/lib/utils";
import { getTrustStyles, type TrustTone } from "@/lib/utils/trust-helpers";

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
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
    >
      {showDot && <span className={cn("size-1.5 rounded-full", styles.dot)} />}
      {label}
    </span>
  );
}
