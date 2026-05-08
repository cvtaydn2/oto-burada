"use client";

import { Building2, FileText, Image as ImageIcon, Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useActionState } from "react";

import type { ProfileActionState } from "@/features/auth/lib/profile-actions";
import { AuthSubmitButton } from "@/features/forms/components/auth-submit-button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";
import { cn } from "@/lib";

interface CorporateProfileFormProps {
  action: (
    state: ProfileActionState | undefined,
    formData: FormData
  ) => Promise<ProfileActionState>;
  initialValues: {
    businessName: string;
    businessAddress: string;
    businessDescription: string;
    taxId: string;
    taxOffice: string;
    websiteUrl: string;
    businessLogoUrl: string;
    businessSlug: string;
  };
  isReadOnly?: boolean;
}

const initialState: ProfileActionState = {};

export function CorporateProfileForm({
  action,
  initialValues,
  isReadOnly = false,
}: CorporateProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  const values = {
    businessName: state.fields?.businessName ?? initialValues.businessName,
    businessSlug: state.fields?.businessSlug ?? initialValues.businessSlug,
    businessAddress: state.fields?.businessAddress ?? initialValues.businessAddress,
    businessDescription: state.fields?.businessDescription ?? initialValues.businessDescription,
    taxId: state.fields?.taxId ?? initialValues.taxId,
    taxOffice: state.fields?.taxOffice ?? initialValues.taxOffice,
    websiteUrl: state.fields?.websiteUrl ?? initialValues.websiteUrl,
    businessLogoUrl: state.fields?.businessLogoUrl ?? initialValues.businessLogoUrl,
  };

  return (
    <form
      action={formAction}
      className={cn("space-y-6", isReadOnly && "pointer-events-none opacity-80")}
    >
      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-foreground uppercase italic">
                Galeri & Marka Bilgileri
              </h3>
              {isReadOnly && <Lock size={14} className="text-muted-foreground" />}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Mağaza sayfanızda ve ilan kartlarınızda görünecek kurumsal kimlik bilgileri.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Galerisi Adı</span>
            <Input
              type="text"
              name="businessName"
              placeholder="Örn: Cevat Otomotiv"
              defaultValue={values.businessName}
              required
              disabled={isReadOnly}
              aria-invalid={state.error ? "true" : undefined}
              aria-describedby={state.error ? "profile-error" : undefined}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50"
            />
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Mağaza URL (Slug)</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-xs font-medium">
                /galeri/
              </span>
              <Input
                type="text"
                name="businessSlug"
                placeholder="galeri-adiniz"
                defaultValue={values.businessSlug}
                required
                disabled={isReadOnly}
                aria-invalid={state.error ? "true" : undefined}
                aria-describedby={state.error ? "profile-error" : undefined}
                className="h-12 w-full rounded-xl border border-input bg-background pl-[80px] pr-4 text-sm outline-none transition-colors focus:border-indigo-500 font-medium disabled:bg-muted/50"
              />
            </div>
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Mağaza Açıklaması</span>
            <textarea
              name="businessDescription"
              placeholder="Galeriniz hakkında kısa bilgi..."
              defaultValue={values.businessDescription}
              rows={3}
              disabled={isReadOnly}
              aria-invalid={state.error ? "true" : undefined}
              aria-describedby={state.error ? "profile-error" : undefined}
              className="w-full rounded-xl border border-input bg-background p-4 text-sm outline-none transition-colors focus:border-indigo-500 resize-none disabled:bg-muted/50"
            />
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Mağaza Logosu (URL)</span>
            <div className="flex gap-3">
              <Input
                type="url"
                name="businessLogoUrl"
                placeholder="https://..."
                defaultValue={values.businessLogoUrl}
                disabled={isReadOnly}
                aria-invalid={state.error ? "true" : undefined}
                aria-describedby={state.error ? "profile-error" : undefined}
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50"
              />
              <div className="size-12 rounded-xl border border-border bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                {values.businessLogoUrl ? (
                  <Image
                    src={values.businessLogoUrl}
                    alt="Logo Preview"
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="size-5 text-slate-300" />
                )}
              </div>
            </div>
          </Label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground uppercase italic">
              Resmi & İletişim Bilgileri
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Fatura ve doğrulama süreçlerinde kullanılacak resmi kayıtlar.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Vergi Dairesi</span>
            <Input
              type="text"
              name="taxOffice"
              defaultValue={values.taxOffice}
              disabled={isReadOnly}
              aria-invalid={!!state.error}
              aria-describedby={state.error ? "profile-error" : undefined}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50 aria-invalid:border-destructive"
            />
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Vergi Numarası</span>
            <Input
              type="text"
              name="taxId"
              defaultValue={values.taxId}
              disabled={isReadOnly}
              aria-invalid={!!state.error}
              aria-describedby={state.error ? "profile-error" : undefined}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50 aria-invalid:border-destructive"
            />
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Adres</span>
            <Input
              type="text"
              name="businessAddress"
              defaultValue={values.businessAddress}
              disabled={isReadOnly}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50"
            />
          </Label>

          <Label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Web Sitesi</span>
            <Input
              type="url"
              name="websiteUrl"
              placeholder="https://..."
              defaultValue={values.websiteUrl}
              disabled={isReadOnly}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500 disabled:bg-muted/50"
            />
          </Label>
        </div>
      </section>

      {state.error && (
        <p
          id="profile-error"
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-bold"
        >
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 font-bold flex items-center gap-2"
        >
          <ShieldCheck className="size-4" />
          {state.success}
        </p>
      )}

      {!isReadOnly && (
        <div className="flex justify-end">
          <AuthSubmitButton label="Kurumsal Bilgileri Kaydet" />
        </div>
      )}
    </form>
  );
}
