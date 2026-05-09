import { Globe } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type SectionTone = "blue" | "amber" | "indigo" | "emerald";

interface SectionHeaderProps {
  icon: typeof Globe;
  title: string;
  description: string;
  tone: SectionTone;
}

export function SectionHeader({ icon: Icon, title, description, tone }: SectionHeaderProps) {
  const toneClasses = {
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-600",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
  }[tone];

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn("flex size-12 items-center justify-center rounded-2xl border", toneClasses)}
      >
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface FieldBlockProps {
  label: string;
  hint: string;
  children: React.ReactNode;
  compact?: boolean;
}

export function FieldBlock({ label, hint, children, compact = false }: FieldBlockProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-muted/20 p-4",
        compact && "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      )}
    >
      <div className={cn("space-y-1", compact && "sm:max-w-[70%]")}>
        <Label className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          {label}
        </Label>
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      </div>
      <div className={cn("mt-3", compact ? "sm:mt-0 sm:w-auto" : "")}>{children}</div>
    </div>
  );
}

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  badge: string;
  danger?: boolean;
  warning?: boolean;
}

export function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  badge,
  danger = false,
  warning = false,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors sm:p-5",
        danger
          ? "border-rose-200 bg-rose-50/80"
          : warning
            ? "border-amber-200 bg-amber-50/70"
            : "border-border/70 bg-muted/20"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                danger
                  ? "bg-rose-100 text-rose-700"
                  : warning
                    ? "bg-amber-100 text-amber-700"
                    : checked
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
              )}
            >
              {badge}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}
