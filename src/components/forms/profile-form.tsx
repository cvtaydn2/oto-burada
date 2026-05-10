"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Camera, CheckCircle2, Loader2, Mail, MapPin, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailVerificationDialog } from "@/features/auth/components/email-verification-dialog";
import {
  type ProfileUpdateInput,
  profileUpdateInputSchema,
} from "@/features/profile/lib/profile-validators";
import { updateProfileInformationAction } from "@/features/profile/services/profile/profile-actions";

interface ProfileFormProps {
  initialValues: ProfileUpdateInput;
  cityOptions: string[];
  isEmailVerified?: boolean;
}

export function ProfileForm({
  initialValues,
  cityOptions,
  isEmailVerified = false,
}: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isVerifiedLocally, setIsVerifiedLocally] = useState(isEmailVerified);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateInputSchema),
    defaultValues: {
      fullName: initialValues.fullName ?? "",
      phone: initialValues.phone ?? "",
      city: initialValues.city ?? "",
      avatarUrl: initialValues.avatarUrl ?? "",
    },
  });

  const watchedValues = useWatch({
    control: form.control,
  });

  async function onSubmit(values: ProfileUpdateInput) {
    startTransition(async () => {
      try {
        const result = await updateProfileInformationAction(values);

        if (result.status === "success") {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
          if (result.fieldErrors) {
            Object.entries(result.fieldErrors).forEach(([key, msg]) => {
              form.setError(key as keyof ProfileUpdateInput, { message: msg });
            });
          }
        }
      } catch {
        toast.error("Sistemsel bir hata oluştu. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserRound className="size-4 text-primary" />
            Tam Ad
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {watchedValues.fullName || "Henüz eklenmedi"}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mail className="size-4 text-primary" />
              E-posta
            </div>
            {isVerifiedLocally ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
              <AlertCircle className="size-4 text-amber-500" />
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {isVerifiedLocally ? "Doğrulandı" : "Doğrulanmadı"}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            Şehir
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {watchedValues.city || "Henüz eklenmedi"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
            <Camera className="size-3" />
            Avatar
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {watchedValues.avatarUrl ? "URL hazır" : "Opsiyonel"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  Güven için ad, telefon ve şehir alanlarını eksiksiz doldurun.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField<ProfileUpdateInput>
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-sm font-medium text-foreground">Ad Soyad</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ad Soyad"
                        className="h-12 w-full rounded-xl border-input bg-background text-sm transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<ProfileUpdateInput>
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <div className="mb-1 flex items-center justify-between">
                      <FormLabel className="text-sm font-medium text-foreground">Telefon</FormLabel>
                      {!isVerifiedLocally && (
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setIsVerifyDialogOpen(true)}
                          className="h-auto p-0 text-xs font-bold text-primary hover:no-underline"
                        >
                          E-posta Doğrula
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="05xx..."
                        className="h-12 w-full rounded-xl border-input bg-background text-sm transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<ProfileUpdateInput>
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Şehir</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 w-full rounded-xl border-input bg-background text-sm">
                          <SelectValue placeholder="Şehir seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 rounded-xl">
                        {cityOptions.map((city) => (
                          <SelectItem key={city} value={city} className="cursor-pointer rounded-lg">
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Camera className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Profil Resmi
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Şu an resim linki (URL) ile çalışır, dilerseniz boş bırakabilirsiniz.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <FormField<ProfileUpdateInput>
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Avatar URL (Opsiyonel)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="url"
                        placeholder="https://..."
                        className="h-12 w-full rounded-xl border-input bg-background text-sm transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-center rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Tavsiye
                </p>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-muted-foreground">
                  Resim eklemek ilan güveninizi artırır.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Profili Güncelle"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <EmailVerificationDialog
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onSuccess={() => {
          setIsVerifiedLocally(true);
          setIsVerifyDialogOpen(false);
        }}
      />
    </>
  );
}
