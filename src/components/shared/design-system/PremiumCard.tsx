import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "gradient" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

export function PremiumCard({
  children,
  className,
  variant = "default",
  padding = "md",
  hoverable = false,
}: PremiumCardProps) {
  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variants = {
    default: "bg-white border border-slate-200",
    glass: "bg-white/70 backdrop-blur-md border border-white/40 shadow-xl shadow-slate-200/50",
    gradient: "bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm",
    elevated: "bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variants[variant],
        paddings[padding],
        hoverable && "hover:shadow-lg hover:-translate-y-1 hover:border-indigo-100",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  title,
  subtitle,
  icon: Icon,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-2 mb-1.5 text-indigo-600 font-bold tracking-widest uppercase text-[10px]">
        {Icon && <Icon size={14} />}
        <span>{subtitle}</span>
      </div>
      <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
    </div>
  );
}
