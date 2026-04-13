"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, ArrowRight } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { SearchSuggestionItem } from "@/types";

interface SearchSuggestion {
  type: "brand" | "city" | "model";
  label: string;
  value: string;
}

interface SearchWithSuggestionsProps {
  placeholder?: string;
  className?: string;
  suggestions?: SearchSuggestionItem[];
}

export function SearchWithSuggestions({
  placeholder = "Marka, model veya şehir ara...",
  className = "",
  suggestions = [],
}: SearchWithSuggestionsProps) {
  const [query, setQuery] = useState("");
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
      .filter((suggestion) =>
        suggestion.label.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
      )
      .slice(0, 6)
      .map<SearchSuggestion>((suggestion) => ({
        label: suggestion.label,
        type: suggestion.type,
        value: suggestion.value,
      }));
  }, [query, suggestions]);

  const fallbackSuggestions = useMemo(
    () => (Array.isArray(suggestions) ? suggestions : []).slice(0, 5),
    [suggestions],
  );

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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Ara"
          aria-autocomplete="list"
          aria-expanded={hasSuggestions}
          aria-controls={suggestionsId}
          aria-haspopup="listbox"
          className="w-full h-10 pl-11 pr-10 bg-gray-100 border-transparent text-gray-700 text-sm rounded-full focus:bg-white focus:border-blue-500 outline-none transition"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
            aria-label="Temizle"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
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
                  <span className="ml-auto text-xs text-slate-400">
                    {s.type === "brand" ? "Marka" : s.type === "city" ? "Şehir" : "Model"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4">
              <p className="px-4 py-1 text-xs font-medium text-slate-400 uppercase">
                Canlı öneriler
              </p>
              {fallbackSuggestions.map((s, i) => (
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
