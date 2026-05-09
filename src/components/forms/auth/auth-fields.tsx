"use client";

import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/lib/actions";

interface FieldProps {
  state: AuthActionState;
}

export function FullNameField({ state }: FieldProps) {
  const fullNameHintId = "register-full-name-hint";
  return (
    <div className="space-y-2">
      <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground ml-1">
        Ad Soyad
      </Label>
      <Input
        id="fullName"
        type="text"
        name="fullName"
        defaultValue={state?.fields?.fullName ?? ""}
        autoComplete="name"
        placeholder="Ad Soyad"
        required
        minLength={3}
        aria-invalid={!!state?.fieldErrors?.fullName}
        aria-describedby={`${fullNameHintId} ${state?.fieldErrors?.fullName ? "fullName-error" : ""}`}
        className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
      />
      <p id={fullNameHintId} className="px-1 text-[11px] font-medium text-muted-foreground">
        İlan ve hesap işlemlerinde görünecek ad soyadınızı yazın.
      </p>
      {state?.fieldErrors?.fullName && (
        <p
          id="fullName-error"
          role="alert"
          className="px-1 text-[11px] font-medium text-destructive"
        >
          {state.fieldErrors.fullName[0]}
        </p>
      )}
    </div>
  );
}

export function EmailField({ state }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-xs font-medium text-muted-foreground ml-1">
        E-posta Adresi
      </Label>
      <Input
        id="email"
        type="email"
        name="email"
        defaultValue={state?.fields?.email ?? ""}
        autoComplete="email"
        placeholder="isim@example.com"
        required
        aria-invalid={!!state?.fieldErrors?.email || !!state?.error}
        aria-describedby={`${state?.fieldErrors?.email ? "email-error" : ""} ${state?.error ? "auth-error" : ""}`}
        className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
      />
      {state?.fieldErrors?.email && (
        <p id="email-error" role="alert" className="px-1 text-[11px] font-medium text-destructive">
          {state.fieldErrors.email[0]}
        </p>
      )}
    </div>
  );
}

interface PasswordFieldProps extends FieldProps {
  isLogin: boolean;
  passwordHintId: string;
  passwordPlaceholder: string;
  passwordAutoComplete: string;
  passwordHint: string;
}

export function PasswordField({
  state,
  isLogin,
  passwordHintId,
  passwordPlaceholder,
  passwordAutoComplete,
  passwordHint,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
          Şifre
        </Label>
        {isLogin && (
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-primary hover:underline"
          >
            Unuttum?
          </Link>
        )}
      </div>
      <Input
        id="password"
        type="password"
        name="password"
        autoComplete={passwordAutoComplete}
        placeholder={passwordPlaceholder}
        required
        minLength={8}
        aria-invalid={!!state?.fieldErrors?.password || !!state?.error}
        aria-describedby={`${passwordHintId} ${state?.fieldErrors?.password ? "password-error" : ""} ${state?.error ? "auth-error" : ""}`}
        className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
      />
      <p id={passwordHintId} className="px-1 text-[11px] font-medium text-muted-foreground">
        {passwordHint}
      </p>
      {state?.fieldErrors?.password && (
        <p
          id="password-error"
          role="alert"
          className="px-1 text-[11px] font-medium text-destructive"
        >
          {state.fieldErrors.password[0]}
        </p>
      )}

      {isLogin && (
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            className="rounded border-input bg-muted/30 text-primary focus:ring-primary cursor-pointer"
          />
          <Label
            htmlFor="remember"
            className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
          >
            Beni Hatırla
          </Label>
        </div>
      )}

      {!isLogin && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
            Şifre Tekrar
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Şifrenizi tekrar girin"
            required
            minLength={8}
            aria-invalid={!!state?.fieldErrors?.confirmPassword}
            aria-describedby={state?.fieldErrors?.confirmPassword ? "confirm-password-error" : ""}
            className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
          />
          {state?.fieldErrors?.confirmPassword && (
            <p
              id="confirm-password-error"
              role="alert"
              className="px-1 text-[11px] font-medium text-destructive"
            >
              {state.fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
