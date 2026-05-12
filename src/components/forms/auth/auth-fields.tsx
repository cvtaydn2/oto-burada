"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Field, useFieldContext } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/features/auth/lib/actions";

interface FieldProps {
  state: AuthActionState;
}

/**
 * Local utilities to attach Field Context descriptions and messages
 * automatically ensuring standard Input primitive links correctly.
 */
function FieldDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const field = useFieldContext();
  return (
    <p id={field?.descriptionId} className={className}>
      {children}
    </p>
  );
}

function FieldMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  const field = useFieldContext();
  return (
    <p id={field?.messageId} role="alert" className={className}>
      {children}
    </p>
  );
}

/**
 * Mini internal wrapper for raw checkbox that connects to Field Context IDs.
 */
function CheckboxWithContext() {
  const field = useFieldContext();
  return (
    <>
      <input
        type="checkbox"
        id={field?.inputId}
        name="remember"
        className="peer h-4 w-4 rounded border-input bg-muted/30 text-primary focus:ring-primary cursor-pointer"
      />
      <Label className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
        Beni Hatırla
      </Label>
    </>
  );
}

export function FullNameField({ state }: FieldProps) {
  return (
    <Field className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground ml-1">Ad Soyad</Label>
      <Input
        type="text"
        name="fullName"
        defaultValue={state?.fields?.fullName ?? ""}
        autoComplete="name"
        placeholder="Ad Soyad"
        required
        minLength={3}
        aria-invalid={!!state?.fieldErrors?.fullName}
        className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
      />
      <FieldDescription className="px-1 text-[11px] font-medium text-muted-foreground">
        İlan ve hesap işlemlerinde görünecek ad soyadınızı yazın.
      </FieldDescription>
      {state?.fieldErrors?.fullName && (
        <FieldMessage className="px-1 text-[11px] font-medium text-destructive">
          {state.fieldErrors.fullName[0]}
        </FieldMessage>
      )}
    </Field>
  );
}

export function EmailField({ state }: FieldProps) {
  return (
    <Field className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground ml-1">E-posta Adresi</Label>
      <Input
        type="email"
        name="email"
        defaultValue={state?.fields?.email ?? ""}
        autoComplete="email"
        placeholder="isim@example.com"
        required
        aria-invalid={!!state?.fieldErrors?.email || !!state?.error}
        className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
      />
      {state?.fieldErrors?.email && (
        <FieldMessage className="px-1 text-[11px] font-medium text-destructive">
          {state.fieldErrors.email[0]}
        </FieldMessage>
      )}
    </Field>
  );
}

interface PasswordFieldProps extends FieldProps {
  isLogin: boolean;
  passwordPlaceholder: string;
  passwordAutoComplete: string;
  passwordHint: string;
}

export function PasswordField({
  state,
  isLogin,
  passwordPlaceholder,
  passwordAutoComplete,
  passwordHint,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <Field className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <Label className="text-xs font-medium text-muted-foreground">Şifre</Label>
          {isLogin && (
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Unuttum?
            </Link>
          )}
        </div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete={passwordAutoComplete}
            placeholder={passwordPlaceholder}
            required
            minLength={8}
            aria-invalid={!!state?.fieldErrors?.password || !!state?.error}
            className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 pr-12 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldDescription className="px-1 text-[11px] font-medium text-muted-foreground">
          {passwordHint}
        </FieldDescription>
        {state?.fieldErrors?.password && (
          <FieldMessage className="px-1 text-[11px] font-medium text-destructive">
            {state.fieldErrors.password[0]}
          </FieldMessage>
        )}
      </Field>

      {isLogin && (
        <Field className="flex items-center gap-2 pt-1">
          <CheckboxWithContext />
        </Field>
      )}

      {!isLogin && (
        <Field className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground ml-1">Şifre Tekrar</Label>
          <div className="relative">
            <Input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Şifrenizi tekrar girin"
              required
              minLength={8}
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
              className="h-12 w-full rounded-xl border border-input bg-muted/30 px-4 pr-12 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/10 aria-invalid:border-destructive aria-invalid:ring-destructive/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {state?.fieldErrors?.confirmPassword && (
            <FieldMessage className="px-1 text-[11px] font-medium text-destructive">
              {state.fieldErrors.confirmPassword[0]}
            </FieldMessage>
          )}
        </Field>
      )}
    </div>
  );
}
