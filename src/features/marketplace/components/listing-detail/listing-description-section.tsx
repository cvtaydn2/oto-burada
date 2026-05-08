interface ListingDescriptionSectionProps {
  description: string;
}

export function ListingDescriptionSection({ description }: ListingDescriptionSectionProps) {
  return (
    <section id="aciklama" className="scroll-mt-24 rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-bold text-foreground">İlan Açıklaması</h2>
      <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
        {description}
      </p>
    </section>
  );
}
