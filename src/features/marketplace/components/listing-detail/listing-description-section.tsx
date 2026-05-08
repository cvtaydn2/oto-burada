interface ListingDescriptionSectionProps {
  description: string;
}

export function ListingDescriptionSection({ description }: ListingDescriptionSectionProps) {
  return (
    <section
      id="aciklama"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-5 lg:p-6"
    >
      <h2 className="mb-3 text-lg font-bold text-foreground sm:mb-4">İlan Açıklaması</h2>
      <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{description}</p>
    </section>
  );
}
