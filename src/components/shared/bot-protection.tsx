"use client";

import { useEffect } from "react";

import { useTurnstile } from "@/hooks/use-turnstile";

interface BotProtectionProps {
  onVerify: (token: string | null) => void;
  sitekey?: string;
  className?: string;
}

export function BotProtection({ onVerify, sitekey, className }: BotProtectionProps) {
  const { token, containerRef, isEnabled } = useTurnstile({
    siteKey: sitekey,
  });

  useEffect(() => {
    onVerify(token);
  }, [token, onVerify]);

  if (!isEnabled) return null;

  return <div ref={containerRef} className={className} />;
}
