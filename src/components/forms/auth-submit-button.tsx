"use client";

import { useFormStatus } from "react-dom";

interface AuthSubmitButtonProps {
  label: string;
}

export function AuthSubmitButton({ label }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "İşleniyor..." : label}
    </button>
  );
}
