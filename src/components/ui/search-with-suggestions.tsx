"use client";

import { ArrowRight, History, Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useKeyboard } from "@/hooks/use-keyboard";
import { cn } from "@/lib/utils";
import type { SearchSuggestionItem } from "@/types";

interface SearchSuggestion {
  type: "brand" | "city" | "model" | "trending" | "category";
  label: string;
  value: string;
}

interface SearchWithSuggestionsProps {
  placeholder?: string;
  className?: string;
  suggestions?: SearchSuggestionItem[];
  currentFilters?: Record<string, string>;
}

const POPULAR_SEARCHES: SearchSuggestion[] = [
  { type: "trending", label: "Düşük Kilometre Araçlar", value: "mileage_asc" },
  { type: "trending", label: "BMW 3 Serisi", value: "BMW 3" },
  { type: "trending", label: "Fiat Egea", value: "Fiat Egea" },
  { type: "trending", label: "Sahibinden Acil", value: "acil" },
];

export function SearchWithSuggestions({
  placeholder = "Marka, model veya şehir ara...",
  className = "",
  suggestions = [],
  currentFilters,
}: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const suggestionsId = useId();

  const filteredSuggestions = useMemo(() => {
    if (query.length < 1) {
      return [];
    }
    const normalizedQuery = query.toLocaleLowerCase("tr-TR");

    const list = Array.isArray(suggestions) ? suggestions : [];
    return list
      .filter((suggestion) => suggestion.label.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
      .slice(0, 6)
      .map<SearchSuggestion>((suggestion) => ({
        label: suggestion.label,
        type: suggestion.type as SearchSuggestion["type"],
        value: suggestion.value,
      }));
  }, [query, suggestions]);

  const visibleSuggestions = query.length === 0 ? POPULAR_SEARCHES : filteredSuggestions;
  const hasResults = query.length >= 1;
  const showSuggestions = isFocused && (hasResults || query.length === 0);
  const activeOptionId =
    showSuggestions && highlightedIndex >= 0
      ? `${suggestionsId}-option-${highlightedIndex}`
      : undefined;

  const handleSearch = (searchQuery: string, type?: string) => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams(currentFilters ?? {});

      if (type === "trending" && searchQuery === "mileage_asc") {
        params.set("sort", "mileage_asc");
      } else {
        params.set("query", searchQuery.trim());
      }

      params.delete("page");
      router.push(`/listings?${params.toString()}`);
      setQuery("");
      setHighlightedIndex(-1);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectHighlighted = () => {
    if (highlightedIndex >= 0 && visibleSuggestions[highlightedIndex]) {
      const suggestion = visibleSuggestions[highlightedIndex];
      handleSearch(suggestion.value, suggestion.type);
      return;
    }

    handleSearch(query);
  };

  useEffect(() => {
    const nextIndex = showSuggestions && visibleSuggestions.length > 0 ? 0 : -1;
    const timer = setTimeout(() => {
      setHighlightedIndex(nextIndex);
    }, 0);

    return () => clearTimeout(timer);
  }, [showSuggestions, visibleSuggestions.length]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useKeyboard({
    shortcuts: [
      {
        key: "k",
        ctrl: true,
        action: () => inputRef.current?.focus(),
        description: "Ara",
      },
    ],
    onEscape: () => {
      setQuery("");
      setHighlightedIndex(-1);
      setIsFocused(false);
      inputRef.current?.blur();
    },
    onEnter: () => {
      if (showSuggestions) {
        handleSelectHighlighted();
      } else {
        handleSearch(query);
      }
    },
  });

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative group">
        <span
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground/50"
          )}
        >
          <Search size={18} strokeWidth={2.5} />
        </span>
        <input
          ref={inputRef}
          id="header-search"
          name="query"
          type="search"
          role="combobox"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => setIsFocused(false), 120);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={(event) => {
            if (!showSuggestions || visibleSuggestions.length === 0) return;

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlightedIndex((current) =>
                current < visibleSuggestions.length - 1 ? current + 1 : 0
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightedIndex((current) =>
                current > 0 ? current - 1 : visibleSuggestions.length - 1
              );
            }
          }}
          placeholder={placeholder}
          aria-label="Ara"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={suggestionsId}
          aria-haspopup="listbox"
          aria-activedescendant={activeOptionId}
          className={cn(
            "h-12 w-full rounded-2xl border-2 border-transparent bg-muted/30 pl-12 pr-12 text-sm font-medium text-foreground outline-none transition-all duration-300",
            "focus:border-primary/20 focus:bg-card focus:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
            "placeholder:text-muted-foreground/30"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setHighlightedIndex(-1);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Temizle"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div
          id={suggestionsId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[100] mt-3 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {query.length === 0 ? (
            <div className="py-4">
              <div className="flex items-center gap-2 px-5 py-2">
                <TrendingUp size={14} className="text-primary" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Popüler Aramalar
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1 px-2 sm:grid-cols-2">
                {POPULAR_SEARCHES.map((s, i) => (
                  <button
                    key={i}
                    id={`${suggestionsId}-option-${i}`}
                    role="option"
                    aria-selected={highlightedIndex === i}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSearch(s.value, s.type)}
                    className={cn(
                      "group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors",
                      highlightedIndex === i ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <History size={14} />
                    </div>
                    <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <div className="py-3">
              <div className="px-5 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Eşleşen Sonuçlar
                </p>
              </div>
              <div className="space-y-1 px-2">
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    id={`${suggestionsId}-option-${i}`}
                    role="option"
                    aria-selected={highlightedIndex === i}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSearch(s.value, s.type)}
                    className={cn(
                      "group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors",
                      highlightedIndex === i ? "bg-primary/5" : "hover:bg-primary/5"
                    )}
                  >
                    <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <Search size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{s.label}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {s.type === "brand" ? "Marka" : s.type === "city" ? "Şehir" : "Model"}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="ml-auto text-muted-foreground/20 transition-all group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Search size={20} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-foreground">Sonuç bulunamadı</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Farklı bir anahtar kelime deneyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {showSuggestions && (
        <div
          className="fixed inset-0 z-[90] bg-background/5 backdrop-blur-[2px]"
          onMouseDown={() => setIsFocused(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
