import { Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Shield;
}

export function MetricCard({ title, value, description, icon: Icon }: MetricCardProps) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs">{description}</CardDescription>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="break-words text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

interface InfoBlockProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function InfoBlock({ label, value, mono = false }: InfoBlockProps) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-all text-sm font-medium text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </p>
    </div>
  );
}
