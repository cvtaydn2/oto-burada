"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

interface AuthSubmitButtonProps {
  label: string;
  icon?: React.ReactNode;
}

export function AuthSubmitButton({ label, icon }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-white shadow-md transition-all hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle size={18} className="animate-spin" />
          İşleniyor...
        </>
      ) : (
        <>
          {label}
          {icon}
        </>
      )}
    </button>
  );
}
