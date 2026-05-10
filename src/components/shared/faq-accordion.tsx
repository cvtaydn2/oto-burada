"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-border/60">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        const answerId = `faq-answer-${i}`;

        return (
          <div key={item.q}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={answerId}
              className="flex h-auto w-full items-center justify-between rounded-none px-5 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 hover:text-foreground sm:px-6"
            >
              <span className="pr-4 leading-6">{item.q}</span>
              <ChevronDown
                size={18}
                className={cn(
                  "shrink-0 text-muted-foreground/70 transition-transform duration-200",
                  isOpen && "rotate-180 text-primary"
                )}
              />
            </Button>
            {isOpen && (
              <div
                id={answerId}
                className="animate-in slide-in-from-top-1 px-5 pb-5 text-sm font-medium leading-6 text-muted-foreground duration-200 sm:px-6"
              >
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
