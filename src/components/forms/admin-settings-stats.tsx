import { cn } from "@/lib/utils";

interface StatusSummaryCardProps {
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
}

export function StatusSummaryCard({ label, value, tone }: StatusSummaryCardProps) {
  const toneClassName = {
    default: "border-border/70 bg-background text-foreground",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-rose-200 bg-rose-50 text-rose-800",
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-4 py-4", toneClassName)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
