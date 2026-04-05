interface DashboardPlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function DashboardPlaceholder({
  eyebrow,
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </section>
  );
}
