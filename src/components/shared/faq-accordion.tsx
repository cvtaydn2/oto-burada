"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
    <div className="divide-y divide-slate-50">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors"
          >
            <span>{item.q}</span>
            <ChevronDown
              size={18}
              className={cn(
                "shrink-0 text-muted-foreground/70 transition-transform duration-200",
                openIndex === i && "rotate-180 text-blue-500"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-6 pb-5 text-sm text-muted-foreground font-medium animate-in slide-in-from-top-1 duration-200">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
