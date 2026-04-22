import { cn } from "@/lib/utils";
import { getTrustStyles, type TrustTone } from "@/lib/utils/trust-helpers";

interface TrustNoticeProps {
  title: string;
  description?: string;
  tone?: TrustTone;
  className?: string;
  children?: React.ReactNode;
}

export function TrustNotice({
  title,
  description,
  tone = "amber",
  className,
  children,
}: TrustNoticeProps) {
  const styles = getTrustStyles(tone);

  return (
    <div className={cn("rounded-xl border p-4", styles.notice, className)}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold">{title}</p>
        {description && <p className="text-xs font-medium opacity-80">{description}</p>}
        {children}
      </div>
    </div>
  );
}
