import { ArrowRight, Sparkles } from "lucide-react";

type MarketSummaryItem = {
  label: string;
  value: string;
  helper: string;
  toneClassName: string;
};

type MarketJourneyStep = {
  id: string;
  title: string;
  description: string;
};

interface HomeMarketInsightsProps {
  summaryItems: MarketSummaryItem[];
  steps: MarketJourneyStep[];
}

export function HomeMarketInsights({ summaryItems, steps }: HomeMarketInsightsProps) {
  return (
    <div className="rounded-[2rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
      <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-accent/50 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3.5" />
          Canlı pazar özeti
        </div>

        <div className="mt-4 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Aradığını daha hızlı daralt</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Figma component taslağındaki kart ve badge diliyle, bugünkü ilan akışını tek
            bakışta özetleyen kısa bir başlangıç alanı hazırladık.
          </p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-[1.25rem] border border-border/70 bg-background p-4 ${item.toneClassName}`}
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {item.value}
              </dd>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.helper}</p>
            </div>
          ))}
        </dl>

        <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/90 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ArrowRight className="size-4 text-primary" />
            3 adımda başla
          </div>

          <ol className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className="flex gap-3 rounded-[1.25rem] border border-border/70 bg-muted/30 px-3 py-3"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
