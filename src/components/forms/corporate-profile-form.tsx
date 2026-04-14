"use client";

import Image from "next/image";
import { Building2, ShieldCheck, FileText, Image as ImageIcon } from "lucide-react";
import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";
import type { ProfileActionState } from "@/lib/auth/profile-actions";

interface CorporateProfileFormProps {
  action: (
    state: ProfileActionState | undefined,
    formData: FormData,
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
}

const initialState: ProfileActionState = {};

export function CorporateProfileForm({
  action,
  initialValues,
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
    <form action={formAction} className="space-y-6">
      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground uppercase italic">
              Galeri & Marka Bilgileri
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Mağaza sayfanızda ve ilan kartlarınızda görünecek kurumsal kimlik bilgileri.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Galerisi Adı</span>
            <input
              type="text"
              name="businessName"
              placeholder="Örn: Cevat Otomotiv"
              defaultValue={values.businessName}
              required
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Mağaza URL (Slug)</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium">/gallery/</span>
              <input
                type="text"
                name="businessSlug"
                placeholder="galeri-adiniz"
                defaultValue={values.businessSlug}
                required
                className="h-12 w-full rounded-xl border border-input bg-background pl-[80px] pr-4 text-sm outline-none transition-colors focus:border-indigo-500 font-medium"
              />
            </div>
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Mağaza Açıklaması</span>
            <textarea
              name="businessDescription"
              placeholder="Galeriniz hakkında kısa bilgi..."
              defaultValue={values.businessDescription}
              rows={3}
              className="w-full rounded-xl border border-input bg-background p-4 text-sm outline-none transition-colors focus:border-indigo-500 resize-none"
            />
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Mağaza Logosu (URL)</span>
            <div className="flex gap-3">
              <input
                type="url"
                name="businessLogoUrl"
                placeholder="https://..."
                defaultValue={values.businessLogoUrl}
                className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
              />
              <div className="size-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                {values.businessLogoUrl ? (
                  <Image src={values.businessLogoUrl} alt="Logo Preview" fill className="object-contain p-1" />
                ) : (
                  <ImageIcon className="size-5 text-slate-300" />
                )}
              </div>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
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
          <label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Vergi Dairesi</span>
            <input
              type="text"
              name="taxOffice"
              defaultValue={values.taxOffice}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground">
            <span>Vergi Numarası</span>
            <input
              type="text"
              name="taxId"
              defaultValue={values.taxId}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Adres</span>
            <input
              type="text"
              name="businessAddress"
              defaultValue={values.businessAddress}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-bold text-foreground sm:col-span-2">
            <span>Web Sitesi</span>
            <input
              type="url"
              name="websiteUrl"
              placeholder="https://..."
              defaultValue={values.websiteUrl}
              className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-indigo-500"
            />
          </label>
        </div>
      </section>

      {state.error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive font-bold">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 font-bold flex items-center gap-2">
          <ShieldCheck className="size-4" />
          {state.success}
        </p>
      )}

      <div className="flex justify-end">
        <AuthSubmitButton label="Kurumsal Bilgileri Kaydet" />
      </div>
    </form>
  );
}
