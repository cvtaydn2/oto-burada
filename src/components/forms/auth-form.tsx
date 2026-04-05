"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/lib/auth/actions";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";

interface AuthFormProps {
  action: (
    state: AuthActionState | undefined,
    formData: FormData,
  ) => Promise<AuthActionState>;
  title: string;
  description: string;
  submitLabel: string;
  alternateHref: string;
  alternateLabel: string;
}

const initialState: AuthActionState = {};

export function AuthForm({
  action,
  title,
  description,
  submitLabel,
  alternateHref,
  alternateLabel,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <section className="mx-auto max-w-xl rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">{title}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{description}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
        E-posta ve şifre ile hızlıca hesabına erişebilirsin. İlan vermek ve favorileri yönetmek
        için giriş yapman gerekir.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>E-posta</span>
          <input
            type="email"
            name="email"
            defaultValue={state.fields?.email ?? ""}
            autoComplete="email"
            required
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Şifre</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        {state.error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {state.success}
          </p>
        ) : null}

        <AuthSubmitButton label={submitLabel} />
      </form>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={alternateHref}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          {alternateLabel}
        </Link>
        <Link
          href="/listings"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          İlanları İncele
        </Link>
      </div>
    </section>
  );
}
