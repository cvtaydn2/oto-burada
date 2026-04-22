"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface ListingDescriptionProps {
  description: string
}

export function ListingDescription({ description }: ListingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = description.length > 500

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-foreground">İlan Açıklaması</h2>
        {isLong && (
          isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground/70" /> : <ChevronDown className="w-5 h-5 text-muted-foreground/70" />
        )}
      </button>
      <div className={`mt-3 text-sm text-muted-foreground leading-relaxed ${!isExpanded && !isLong ? '' : isExpanded ? '' : 'line-clamp-3'}`}>
        {/* Strip bare markdown headings (## with no content) that render as noise */}
        <p className="whitespace-pre-wrap">
          {description
            .split("\n")
            .filter(line => !/^#{1,6}\s*$/.test(line))
            .map(line => line.replace(/^#{1,6}\s+/, ""))
            .join("\n")
            .trim()}
        </p>
      </div>
    </div>
  )
}