"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

import { resendVerificationAction } from "@/lib/auth/actions";

interface ResendVerificationButtonProps {
  email?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-14 w-full rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 italic"
    >
      {pending ? (
        <LoaderCircle className="animate-spin" size={20} />
      ) : (
        <>
          TEKRAR GÖNDER
          <RefreshCw size={18} />
        </>
      )}
    </button>
  );
}

export function ResendVerificationButton({ email }: ResendVerificationButtonProps) {
  const [state, formAction] = useFormState(resendVerificationAction, null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || "Doğrulama e-postası gönderildi.");
      // Defer state update to avoid cascading render lint error
      setTimeout(() => setCountdown(60), 0);
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (countdown > 0) {
    return (
      <div className="h-14 w-full rounded-xl bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold uppercase tracking-widest italic">
        YENİ KOD İÇİN BEKLEYİN: {countdown}s
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full">
      {email && <input type="hidden" name="email" value={email} />}
      <SubmitButton />
    </form>
  );
}
