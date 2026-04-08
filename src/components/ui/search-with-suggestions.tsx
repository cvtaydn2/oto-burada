"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, ArrowRight } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { brandCatalog } from "@/data";

interface SearchSuggestion {
  type: "brand" | "model" | "recent";
  label: string;
  value: string;
}

interface SearchWithSuggestionsProps {
  placeholder?: string;
  className?: string;
}

const popularSearches = [
  { label: "Volkswagen Golf", value: "Volkswagen Golf" },
  { label: "Renault Clio", value: "Renault Clio" },
  { label: "Toyota Corolla", value: "Toyota Corolla" },
  { label: "BMW 3 Serisi", value: "BMW 3 Serisi" },
  { label: "Mercedes A Serisi", value: "Mercedes-Benz A Serisi" },
];

export function SearchWithSuggestions({ placeholder = "Marka, model veya şehir ara...", className = "" }: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const suggestionsId = "search-suggestions";

  const filteredSuggestions = useMemo(() => {
    if (query.length < 1) {
      return [];
    }
    const matchedSuggestions: SearchSuggestion[] = [];
    
    brandCatalog.forEach(brand => {
      if (brand.brand.toLowerCase().includes(query.toLowerCase())) {
        matchedSuggestions.push({ type: "brand", label: brand.brand, value: brand.brand });
        brand.models.forEach(model => {
          if (model.toLowerCase().includes(query.toLowerCase())) {
            matchedSuggestions.push({ type: "model", label: `${brand.brand} ${model}`, value: `${brand.brand} ${model}` });
          }
        });
      }
    });
    return matchedSuggestions.slice(0, 6);
  }, [query]);

  const hasSuggestions = query.length >= 1;

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/listings?query=${encodeURIComponent(searchQuery.trim())}`);
      setQuery("");
    }
  };

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: () => inputRef.current?.focus(),
      description: "Ara"
    },
    {
      key: "Escape",
      action: () => {
        setQuery("");
        inputRef.current?.blur();
      }
    },
    {
      key: "Enter",
      action: () => handleSearch(query)
    }
  ]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {}}
          placeholder={placeholder}
          aria-label="Ara"
          aria-autocomplete="list"
          aria-expanded={hasSuggestions}
          aria-controls={suggestionsId}
          aria-haspopup="listbox"
          className="w-full h-10 pl-11 pr-10 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
            aria-label="Temizle"
          >
            <X size={14} className="text-slate-400" />
          </button>
        )}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
          ⌘K
        </span>
      </div>

      {hasSuggestions && (
        <div
          id={suggestionsId}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden"
        >
          {filteredSuggestions.length > 0 ? (
            <div className="py-2">
              <p className="px-4 py-1 text-xs font-medium text-slate-400 uppercase">Öneriler</p>
              {filteredSuggestions.map((s, i) => (
                <button
                  key={i}
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSearch(s.value)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"
                >
                  <Search size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-700">{s.label}</span>
                  <span className="ml-auto text-xs text-slate-400">{s.type === "brand" ? "Marka" : "Model"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4">
              <p className="px-4 py-1 text-xs font-medium text-slate-400 uppercase">Popüler Aramalar</p>
              {popularSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(s.value)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"
                >
                  <TrendingUp size={16} className="text-indigo-400" />
                  <span className="text-sm text-slate-700">{s.label}</span>
                  <ArrowRight size={14} className="ml-auto text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setQuery("")} 
          aria-hidden="true"
        />
      )}
    </div>
  );
}
