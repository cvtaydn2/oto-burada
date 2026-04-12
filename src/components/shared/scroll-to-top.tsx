"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-slate-900 text-slate-900 shadow-2xl transition-all hover:bg-slate-50 active:scale-95 animate-in fade-in slide-in-from-bottom-4 duration-300",
        "lg:bottom-8"
      )}
      aria-label="Yukarı Çık"
    >
      <ArrowUp size={24} strokeWidth={3} />
    </button>
  )
}
