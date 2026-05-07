import { cn } from "@/features/shared/lib";

interface FormSectionProps {
  number: number;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared FormSection component following the Showroom Elite design system.
 * Matches the HTML reference: Number in blue circle + White card with border.
 */
export function FormSection({ number, title, children, className }: FormSectionProps) {
  return (
    <section className={cn("animate-in fade-in slide-in-from-bottom-4 duration-500", className)}>
      <div className="flex items-center mb-6">
        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 text-sm ring-1 ring-primary/20">
          {number}
        </div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
        {children}
      </div>
    </section>
  );
}
