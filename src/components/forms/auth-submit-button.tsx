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
      className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "İşleniyor..." : label}
    </button>
  );
}
