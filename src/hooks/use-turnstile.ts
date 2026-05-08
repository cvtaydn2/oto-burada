"use client";

import { useRef, useState } from "react";

export function useTurnstile(_options?: { siteKey?: string; action?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [token] = useState<string | null>("mock-turnstile-token");
  const isEnabled = true;
  const reset = () => {
    if (_options) {
      // access options to silence warning
    }
  };

  return { token, containerRef, isEnabled, reset };
}
