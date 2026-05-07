import { cn } from "@/features/shared/lib";

interface QuickSystemStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "indigo" | "rose";
}

export function QuickSystemStat({ icon, label, value, color }: QuickSystemStatProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-muted/50 border border-border transition-colors",
          color === "emerald"
            ? "text-emerald-600"
            : color === "blue"
              ? "text-blue-600"
              : color === "rose"
                ? "text-rose-600"
                : "text-indigo-600"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
