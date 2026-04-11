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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-slate-900">İlan Açıklaması</h2>
        {isLong && (
          isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <div className={`mt-3 text-sm text-slate-600 leading-relaxed ${!isExpanded && !isLong ? '' : isExpanded ? '' : 'line-clamp-3'}`}>
        <p className="whitespace-pre-wrap">{description}</p>
      </div>
    </div>
  )
}