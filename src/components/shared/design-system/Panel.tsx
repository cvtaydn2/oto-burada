import { ReactNode } from "react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "primary" | "muted";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export function Panel({ children, className, variant = "default", padding = "md" }: PanelProps) {
  const variants = {
    default: "bg-card border border-border shadow-sm",
    glass: "bg-white/70 backdrop-blur-md border border-white/20 shadow-xl",
    primary: "bg-primary/5 border border-primary/10 shadow-sm",
    muted: "bg-muted border border-border/40 shadow-none",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6 lg:p-8",
    lg: "p-8 lg:p-10",
    xl: "p-10 lg:p-12",
  };

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variants[variant],
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
