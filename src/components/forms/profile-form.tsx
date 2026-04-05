"use client";

import { useActionState } from "react";

import type { ProfileActionState } from "@/lib/auth/profile-actions";
import { AuthSubmitButton } from "@/components/forms/auth-submit-button";

interface ProfileFormProps {
  action: (
    state: ProfileActionState | undefined,
    formData: FormData,
  ) => Promise<ProfileActionState>;
  initialValues: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl: string;
  };
  cityOptions: string[];
}

const initialState: ProfileActionState = {};

export function ProfileForm({
  action,
  initialValues,
  cityOptions,
}: ProfileFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const values = {
    fullName: state.fields?.fullName ?? initialValues.fullName,
    phone: state.fields?.phone ?? initialValues.phone,
    city: state.fields?.city ?? initialValues.city,
    avatarUrl: state.fields?.avatarUrl ?? initialValues.avatarUrl,
  };

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
          <span>Ad Soyad</span>
          <input
            type="text"
            name="fullName"
            defaultValue={values.fullName}
            required
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Telefon</span>
          <input
            type="tel"
            name="phone"
            defaultValue={values.phone}
            required
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Şehir</span>
          <select
            name="city"
            defaultValue={values.city}
            required
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          >
            <option value="">Şehir seç</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
          <span>Avatar URL (opsiyonel)</span>
          <input
            type="url"
            name="avatarUrl"
            defaultValue={values.avatarUrl}
            placeholder="https://..."
            className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>
      </div>

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

      <AuthSubmitButton label="Profili Güncelle" />
    </form>
  );
}
