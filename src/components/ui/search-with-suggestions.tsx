"use client";

import { ArrowRight, History, Search, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

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
  /** Current active filters — if provided, search navigates to /listings preserving them */
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
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const suggestionsId = "search-suggestions";

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

  const hasResults = query.length >= 1;
  const showSuggestions = isFocused && (hasResults || query.length === 0);

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
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

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
      setIsFocused(false);
      inputRef.current?.blur();
    },
    onEnter: () => handleSearch(query),
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
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Ara"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={suggestionsId}
          aria-haspopup="listbox"
          className={cn(
            "w-full h-12 pl-12 pr-12 bg-muted/30 border-2 border-transparent text-foreground text-sm font-medium rounded-2xl outline-none transition-all duration-300",
            "focus:bg-card focus:border-primary/20 focus:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
            "placeholder:text-muted-foreground/30"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-colors"
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
          className="absolute top-full left-0 right-0 mt-3 bg-card rounded-3xl border border-border shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {query.length === 0 ? (
            <div className="py-4">
              <div className="px-5 py-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                  Popüler Aramalar
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-2">
                {POPULAR_SEARCHES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(s.value, s.type)}
                    className="flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 rounded-2xl transition-colors group"
                  >
                    <div className="size-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] italic">
                  Eşleşen Sonuçlar
                </p>
              </div>
              <div className="px-2 space-y-1">
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSearch(s.value)}
                    className="w-full px-4 py-3 text-left hover:bg-primary/5 rounded-2xl flex items-center gap-4 group transition-colors"
                  >
                    <div className="size-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Search size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{s.label}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {s.type === "brand" ? "Marka" : s.type === "city" ? "Şehir" : "Model"}
                      </span>
                    </div>
                    <ArrowRight
                      size={14}
                      className="ml-auto text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 px-6 text-center">
              <div className="size-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Search size={20} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-foreground">Sonuç bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                Farklı bir anahtar kelime deneyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {showSuggestions && (
        <div
          className="fixed inset-0 z-[90] bg-background/5 backdrop-blur-[2px]"
          onClick={() => setIsFocused(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
