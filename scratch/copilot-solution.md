<write_file path="src/features/profile/lib/profile-form-schema.ts">
import { z } from "zod";

export const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmalıdır.")
    .max(120, "Ad soyad en fazla 120 karakter olabilir."),
  phone: z
    .string()
    .trim()
    .min(10, "Telefon en az 10 karakter olmalıdır.")
    .max(20, "Telefon en fazla 20 karakter olabilir."),
  city: z
    .string()
    .trim()
    .min(2, "Şehir seçiniz.")
    .max(80, "Şehir en fazla 80 karakter olabilir."),
  avatarUrl: z
    .union([
      z.literal(""),
      z.string().trim().url("Geçerli bir URL giriniz.").max(500, "Avatar URL çok uzun."),
    ])
    .default(""),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

function normalizeString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function sanitizeProfileFormValues(
  input: Partial<Record<keyof ProfileFormValues, unknown>> | null | undefined
): ProfileFormValues {
  return {
    fullName: normalizeString(input?.fullName),
    phone: normalizeString(input?.phone),
    city: normalizeString(input?.city),
    avatarUrl: normalizeString(input?.avatarUrl),
  };
}
</write_file>

<write_file path="src/features/profile/lib/profile-validators.ts">
import { z } from "zod";

import {
  profileFormSchema,
  sanitizeProfileFormValues,
  type ProfileFormValues,
} from "@/features/profile/lib/profile-form-schema";

export const profileUpdateInputSchema = profileFormSchema;

export const profileActionResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    message: z.string(),
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    fieldErrors: z
      .object({
        fullName: z.array(z.string()).optional(),
        phone: z.array(z.string()).optional(),
        city: z.array(z.string()).optional(),
        avatarUrl: z.array(z.string()).optional(),
      })
      .default({}),
    values: z.object({
      fullName: z.string(),
      phone: z.string(),
      city: z.string(),
      avatarUrl: z.string(),
    }),
  }),
]);

export type ProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>;
export type ProfileActionResult = z.infer<typeof profileActionResultSchema>;

export function normalizeProfileActionValues(rawInput: unknown): ProfileFormValues {
  if (typeof rawInput !== "object" || rawInput === null) {
    return sanitizeProfileFormValues(undefined);
  }

  return sanitizeProfileFormValues(
    rawInput as Partial<Record<keyof ProfileFormValues, unknown>>
  );
}
</write_file>

<write_file path="src/features/profile/services/profile-records.ts">
import "server-only";

import type { User } from "@supabase/supabase-js";

import type { ProfileUpdateInput } from "@/features/profile/lib/profile-validators";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  email_verified: boolean | null;
  is_verified: boolean | null;
  verification_status: "pending" | "approved" | "rejected" | null;
}

function normalizeVerificationStatus(
  value: ProfileRow["verification_status"]
): "pending" | "approved" | "rejected" | "unverified" {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  return "unverified";
}

export async function getProfileRowByUserId(userId: string): Promise<ProfileRow | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, city, avatar_url, email_verified, is_verified, verification_status"
    )
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data;
}

export async function updateProfileRecord(params: {
  userId: string;
  input: ProfileUpdateInput;
}): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: params.userId,
      full_name: params.input.fullName,
      phone: params.input.phone,
      city: params.input.city,
      avatar_url: params.input.avatarUrl || null,
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

export async function getStoredProfileById(userId: string): Promise<Profile | null> {
  const row = await getProfileRowByUserId(userId);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    city: row.city ?? "",
    avatarUrl: row.avatar_url ?? "",
    emailVerified: Boolean(row.email_verified),
    isVerified: Boolean(row.is_verified),
    verificationStatus: normalizeVerificationStatus(row.verification_status),
  } as Profile;
}

export function buildProfileFromAuthUser(user: User): Profile {
  return {
    id: user.id,
    fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "",
    city: typeof user.user_metadata?.city === "string" ? user.user_metadata.city : "",
    avatarUrl:
      typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "",
    emailVerified: Boolean(user.email_confirmed_at),
    isVerified: false,
    verificationStatus: "unverified",
  } as Profile;
}
</write_file>

<write_file path="src/features/profile/services/profile-logic.ts">
import "server-only";

import type { User } from "@supabase/supabase-js";

import { requireUser } from "@/features/auth/lib/session";
import type { ProfileFormValues } from "@/features/profile/lib/profile-form-schema";
import { sanitizeProfileFormValues } from "@/features/profile/lib/profile-form-schema";
import {
  getProfileRowByUserId,
  type ProfileRow,
} from "@/features/profile/services/profile-records";
import {
  getLiveMarketplaceReferenceData,
  mergeCityOptions,
} from "@/features/shared/services/live-reference-data";

export interface DashboardProfileViewModel {
  profile: {
    id: string;
    email: string;
    emailVerified: boolean;
    isVerified: boolean;
    verificationStatus: "pending" | "approved" | "rejected" | "unverified";
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
  formDefaults: ProfileFormValues;
  cityOptions: string[];
  completion: number;
}

function normalizeVerificationStatus(
  value: string | null | undefined
): "pending" | "approved" | "rejected" | "unverified" {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }

  return "unverified";
}

export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null) {
    return [];
  }

  return [value];
}

export function buildDashboardProfileViewModel(params: {
  authUser: User;
  profileRow: ProfileRow | null;
  cityOptions: string[];
}): DashboardProfileViewModel {
  const { authUser, profileRow, cityOptions } = params;

  const formDefaults = sanitizeProfileFormValues({
    fullName: profileRow?.full_name,
    phone: profileRow?.phone,
    city: profileRow?.city,
    avatarUrl: profileRow?.avatar_url,
  });

  const completion = Math.round(
    ([formDefaults.fullName, formDefaults.phone, formDefaults.city].filter((value) => value.length > 0)
      .length /
      3) *
      100
  );

  return {
    profile: {
      id: authUser.id,
      email: authUser.email ?? "",
      emailVerified: Boolean(profileRow?.email_verified ?? authUser.email_confirmed_at),
      isVerified: Boolean(profileRow?.is_verified),
      verificationStatus: normalizeVerificationStatus(profileRow?.verification_status),
      fullName: formDefaults.fullName,
      phone: formDefaults.phone,
      city: formDefaults.city,
      avatarUrl: formDefaults.avatarUrl,
    },
    formDefaults,
    cityOptions,
    completion,
  };
}

export async function getDashboardProfilePageData(): Promise<DashboardProfileViewModel> {
  const user = await requireUser();

  const [profileRow, references] = await Promise.all([
    getProfileRowByUserId(user.id),
    getLiveMarketplaceReferenceData(),
  ]);

  const mergedCities = mergeCityOptions(references.cities, [profileRow?.city ?? ""]);
  const cityOptions = mergedCities.map((item) => item.city);

  return buildDashboardProfileViewModel({
    authUser: user,
    profileRow,
    cityOptions,
  });
}
</write_file>

<write_file path="src/features/profile/lib/profile-actions.ts">
"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/lib/session";
import type { ProfileFormValues } from "@/features/profile/lib/profile-form-schema";
import {
  normalizeProfileActionValues,
  profileActionResultSchema,
  profileUpdateInputSchema,
  type ProfileActionResult,
} from "@/features/profile/lib/profile-validators";
import { updateProfileRecord } from "@/features/profile/services/profile-records";

export async function updateProfileAction(rawInput: unknown): Promise<ProfileActionResult> {
  const user = await requireUser();
  const values = normalizeProfileActionValues(rawInput);

  const parsed = profileUpdateInputSchema.safeParse(values);

  if (!parsed.success) {
    return profileActionResultSchema.parse({
      status: "error",
      message: "Profil bilgileri doğrulanamadı.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    });
  }

  await updateProfileRecord({
    userId: user.id,
    input: parsed.data,
  });

  revalidatePath("/dashboard/profile");

  return profileActionResultSchema.parse({
    status: "success",
    message: "Profil başarıyla güncellendi.",
  });
}

export async function updateProfileActionFromFormData(
  formData: FormData
): Promise<ProfileActionResult> {
  const values: Partial<Record<keyof ProfileFormValues, unknown>> = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    avatarUrl: formData.get("avatarUrl"),
  };

  return updateProfileAction(values);
}
</write_file>

<write_file path="src/features/profile/components/profile-form-card.tsx">
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Camera, CheckCircle2, Mail, MapPin, UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/features/profile/lib/profile-actions";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/features/profile/lib/profile-form-schema";

interface ProfileFormCardProps {
  defaultValues: ProfileFormValues;
  cityOptions: string[];
  isEmailVerified: boolean;
}

export function ProfileFormCard({
  defaultValues,
  cityOptions,
  isEmailVerified,
}: ProfileFormCardProps) {
  const [isPending, startTransition] = useTransition();
  const [serverMessage, setServerMessage] = useState<{
    status: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const watchedFullName = form.watch("fullName");
  const watchedCity = form.watch("city");
  const watchedAvatarUrl = form.watch("avatarUrl");

  function setFieldErrors(fieldErrors: Partial<Record<keyof ProfileFormValues, string[]>>) {
    if (fieldErrors.fullName?.[0]) {
      form.setError("fullName", { message: fieldErrors.fullName[0] });
    }

    if (fieldErrors.phone?.[0]) {
      form.setError("phone", { message: fieldErrors.phone[0] });
    }

    if (fieldErrors.city?.[0]) {
      form.setError("city", { message: fieldErrors.city[0] });
    }

    if (fieldErrors.avatarUrl?.[0]) {
      form.setError("avatarUrl", { message: fieldErrors.avatarUrl[0] });
    }
  }

  function onSubmit(values: ProfileFormValues) {
    setServerMessage(null);

    startTransition(() => {
      void (async () => {
        const result = await updateProfileAction(values);

        if (result.status === "error") {
          setFieldErrors(result.fieldErrors);
          setServerMessage({ status: "error", text: result.message });
          return;
        }

        form.reset(values);
        setServerMessage({ status: "success", text: result.message });
      })();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
          <UserRound size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Kimlik Bilgileri</h3>
          <p className="text-xs font-medium text-muted-foreground">
            Bireysel bilgileriniz ilanlarınızda görünür.
          </p>
        </div>
      </div>

      <form className="space-y-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserRound className="size-4 text-primary" />
              Tam Ad
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {watchedFullName || "Henüz eklenmedi"}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="size-4 text-primary" />
                E-posta
              </div>
              {isEmailVerified ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <AlertCircle className="size-4 text-amber-500" />
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {isEmailVerified ? "Doğrulandı" : "Doğrulanmadı"}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              Şehir
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {watchedCity || "Henüz eklenmedi"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
              <Camera className="size-3" />
              Avatar
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {watchedAvatarUrl ? "URL hazır" : "Opsiyonel"}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <UserRound className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Temel Profil Bilgileri
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Güven için ad, telefon ve şehir alanlarını eksiksiz doldurun. Bu bilgiler ilan
                akışlarında destekleyici sinyal olarak kullanılır.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                aria-invalid={!!form.formState.errors.fullName}
                className="h-12 rounded-xl"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                aria-invalid={!!form.formState.errors.phone}
                className="h-12 rounded-xl"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Şehir</Label>
              <select
                id="city"
                {...form.register("city")}
                aria-invalid={!!form.formState.errors.city}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary aria-invalid:border-destructive"
              >
                <option value="">Şehir seç</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {form.formState.errors.city && (
                <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Camera className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Avatar ve Son Kayıt
              </h3>
              <p className="text-sm leading-6 text-muted-foreground">
                Avatar alanı opsiyoneldir. Şu an URL ile çalışır; dilersen boş bırakabilirsin.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL (opsiyonel)</Label>
            <Input
              id="avatarUrl"
              {...form.register("avatarUrl")}
              aria-invalid={!!form.formState.errors.avatarUrl}
              className="h-12 rounded-xl"
            />
            {form.formState.errors.avatarUrl && (
              <p className="text-sm text-destructive">
                {form.formState.errors.avatarUrl.message}
              </p>
            )}
          </div>
        </section>

        {!isEmailVerified && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            E-posta adresiniz henüz doğrulanmamış görünüyor. İlan yayın akışında sorun yaşamamak
            için gelen kutunuzdaki doğrulama bağlantısını kontrol edin.
          </div>
        )}

        {serverMessage && (
          <div
            className={
              serverMessage.status === "success"
                ? "rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900"
                : "rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            }
          >
            {serverMessage.text}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-xl px-5"
          >
            {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
</write_file>

<write_file path="src/components/forms/profile-form.tsx">
"use client";

import { ProfileFormCard } from "@/features/profile/components/profile-form-card";
import type { ProfileFormValues } from "@/features/profile/lib/profile-form-schema";

interface ProfileFormProps {
  action?: (
    state: unknown,
    formData: FormData
  ) => Promise<unknown>;
  initialValues: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
  cityOptions: string[];
  isEmailVerified?: boolean;
}

export function ProfileForm({
  initialValues,
  cityOptions,
  isEmailVerified = false,
}: ProfileFormProps) {
  const defaultValues: ProfileFormValues = {
    fullName: initialValues.fullName,
    phone: initialValues.phone,
    city: initialValues.city,
    avatarUrl: initialValues.avatarUrl,
  };

  return (
    <ProfileFormCard
      defaultValues={defaultValues}
      cityOptions={cityOptions}
      isEmailVerified={isEmailVerified}
    />
  );
}
</write_file>

<write_file path="src/components/forms/identity-verification-form.tsx">
"use client";

import { Mail, ShieldCheck } from "lucide-react";

interface IdentityVerificationFormProps {
  isVerified: boolean;
}

export function IdentityVerificationForm({ isVerified }: IdentityVerificationFormProps) {
  if (isVerified) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-100">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Kimliğiniz Doğrulandı</h4>
          <p className="text-xs text-emerald-700/80">Güvenli profil rozetine sahipsiniz.</p>
        </div>
        <ShieldCheck className="ml-auto text-emerald-500" size={20} />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
        <Mail size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground/90">E-posta Doğrulama</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          İlan verebilmek için e-posta adresinizi doğrulamanız gerekmektedir. Kayıt sırasında
          gönderilen doğrulama bağlantısını kontrol edin.
        </p>
      </div>
    </div>
  );
}
</write_file>

<write_file path="src/app/dashboard/profile/page.tsx">
import {
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";

import { IdentityVerificationForm } from "@/components/forms/identity-verification-form";
import { ProfileFormCard } from "@/features/profile/components/profile-form-card";
import { getDashboardProfilePageData } from "@/features/profile/services/profile-logic";
import { trust } from "@/lib/ui-strings";

export const dynamic = "force-dynamic";

interface VerificationItemProps {
  label: string;
  isVerified?: boolean;
  isPending?: boolean;
}

function VerificationItem({
  label,
  isVerified = false,
  isPending = false,
}: VerificationItemProps) {
  if (isPending) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <span className="text-sm font-medium text-foreground/90">{label}</span>
        <div className="flex items-center gap-2 text-amber-700">
          <Clock3 size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">Yakında</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
      <span className="text-sm font-medium text-foreground/90">{label}</span>
      {isVerified ? (
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 size={14} />
          <span className="text-xs font-bold uppercase tracking-wide">Doğrulandı</span>
        </div>
      ) : (
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70">
          Bekliyor
        </span>
      )}
    </div>
  );
}

export default async function DashboardProfilePage() {
  const data = await getDashboardProfilePageData();
  const hasPhone = Boolean(data.profile.phone);
  const showBenefits =
    !data.profile.isVerified && data.profile.verificationStatus !== "pending";

  return (
    <div className="space-y-4 px-3 sm:space-y-6 sm:px-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <User className="text-muted-foreground" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Yönetim Merkezi
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hesap & Profil</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            Hesap bilgilerinizi ve doğrulama durumunuzu yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xl font-bold text-foreground">{data.completion}%</span>
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${data.completion}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Profil Tamamlandı
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">Doğrulama Durumu</h3>
            </div>
            <div className="grid gap-2">
              <VerificationItem label="E-posta" isVerified={data.profile.emailVerified} />
              <VerificationItem
                label="İşletme Profili"
                isVerified={data.profile.isVerified}
              />
              <VerificationItem label="Kimlik (Yakında)" isPending={true} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-foreground">İletişim Bilgileri</h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                <Mail size={14} className="shrink-0 text-muted-foreground/70" />
                <span className="truncate text-sm font-medium text-foreground/90">
                  {data.profile.email}
                </span>
              </div>

              {hasPhone && (
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                  <Phone size={14} className="shrink-0 text-muted-foreground/70" />
                  <span className="text-sm font-medium text-foreground/90">
                    {data.profile.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/dashboard/profile/corporate"
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Kurumsal Mağaza</h4>
                <p className="text-xs text-muted-foreground">Ticarî araç alım satımı için</p>
              </div>
            </div>
            <ShieldCheck size={18} className="shrink-0 text-primary" />
          </Link>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <ProfileFormCard
            defaultValues={data.formDefaults}
            cityOptions={data.cityOptions}
            isEmailVerified={data.profile.emailVerified}
          />

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck size={18} className="text-primary" />
              <div>
                <h3 className="text-base font-bold text-foreground">Doğrulama Durumu</h3>
                <p className="text-xs font-medium text-muted-foreground">
                  Güvenli bir alışveriş ortamı için kimlik doğrulaması önerilir.
                </p>
              </div>
            </div>

            {data.profile.verificationStatus === "pending" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <h4 className="text-sm font-bold text-amber-900">Doğrulama İncelemede</h4>
                <p className="mt-1 text-sm text-amber-800/90">
                  Gönderdiğiniz doğrulama bilgileri inceleniyor. Onaylandığında profil rozetiniz
                  güncellenecektir.
                </p>
              </div>
            ) : (
              <IdentityVerificationForm isVerified={data.profile.isVerified} />
            )}

            {showBenefits && (
              <div className="mt-6 rounded-xl border border-primary/10 bg-primary/5 p-4">
                <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-primary">
                  Doğrulamanın Avantajları
                </h4>
                <ul className="space-y-2">
                  {trust.benefits.list.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex items-center gap-2 text-xs font-medium text-foreground/80"
                    >
                      <CheckCircle2 size={12} className="text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
</write_file>