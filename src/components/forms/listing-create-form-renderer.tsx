"use client";

import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BotProtection } from "@/components/shared/bot-protection";
import { Button } from "@/components/ui/button";
import { EmailVerificationDialog } from "@/features/auth/components/email-verification-dialog";
import { useListingCreation } from "@/features/listing-creation/hooks/use-listing-creation";
import UploadProgress from "@/features/marketplace/components/upload-progress";
import { type BrandCatalogItem, type CityOption, type Listing } from "@/types";

import { StepIndicator } from "./listing-wizard/StepIndicator";
import { DetailsStep } from "./listing-wizard/steps/DetailsStep";
import { InspectionStep } from "./listing-wizard/steps/InspectionStep";
import { PhotosStep } from "./listing-wizard/steps/PhotosStep";
import { VehicleInfoStep } from "./listing-wizard/steps/VehicleInfoStep";

interface ListingCreateFormRendererProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: Listing | null;
  initialValues: { city: string; whatsappPhone: string };
  isEmailVerified?: boolean;
  focusMode?: "default" | "trust";
}

export function ListingCreateFormRenderer({
  brands,
  cities,
  initialListing,
  initialValues,
  isEmailVerified = false,
  focusMode = "default",
}: ListingCreateFormRendererProps) {
  const {
    form,
    fieldArray,
    currentStep,
    totalSteps,
    submitState,
    uploadStates,
    isPlateLoading,
    isEmailVerifiedLocally,
    setIsEmailVerifiedLocally,
    isVerifyDialogOpen,
    setIsVerifyDialogOpen,
    isEditing,
    handleNextStep,
    handlePrevStep,
    handlePlateLookup,
    handleImageChange,
    handleRemoveImage,
    submitListing,
    setSubmitState,
    submitIntentRef,
  } = useListingCreation({ brands, cities, initialListing, initialValues, isEmailVerified });

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const isBotProtectionEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const shouldHighlightTrustFields = isEditing && focusMode === "trust";

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isEmailVerifiedLocally && !isEditing) {
      setIsVerifyDialogOpen(true);
      return;
    }

    if (isBotProtectionEnabled && !turnstileToken && !isEditing) {
      setSubmitState({
        status: "warning",
        message: "Lütfen güvenlik doğrulamasını tamamlayın.",
        code: "TURNSTILE_REQUIRED",
      });
      return;
    }

    await submitListing(values, turnstileToken || undefined);
  });

  const handleFormSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    if (currentStep !== totalSteps - 1 || !submitIntentRef.current) {
      event.preventDefault();
      submitIntentRef.current = false;
      return;
    }
    submitIntentRef.current = false;
    void onSubmit(event);
  };

  return (
    <div className="mx-auto min-h-screen w-full flex-1 bg-slate-50/50 px-4 py-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-6 sm:mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 border border-slate-200 shadow-sm">
            <Car size={12} strokeWidth={3} />
            {currentStep + 1} / {totalSteps}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-6xl">
            {isEditing ? "İlanınızı düzenleyin" : "Yeni ilanınızı incelemeye gönderin"}
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-slate-600 mx-auto">
            {isEditing
              ? "İlanınızın bilgilerini güncelleyin. Değişiklikler moderasyon kontrolünden sonra yayında kalır."
              : "3 kısa adımda aracınızı ekleyin, fotoğraflarınızı yükleyin ve ilanınızı moderasyon incelemesine gönderin."}
          </p>
        </div>

        <div className="mb-6 sm:mb-10">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-10 lg:p-12">
            {currentStep === 0 && (
              <VehicleInfoStep
                form={form}
                brands={brands}
                isPlateLoading={isPlateLoading}
                onPlateLookup={handlePlateLookup}
              />
            )}
            {currentStep === 1 && <DetailsStep form={form} cities={cities} />}
            {currentStep === 2 && (
              <PhotosStep
                form={form}
                fieldArray={fieldArray}
                uploadStates={uploadStates}
                onImageChange={handleImageChange}
                onRemoveImage={handleRemoveImage}
              />
            )}
          </div>

          {shouldHighlightTrustFields && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 shadow-sm">
                    <ShieldCheck className="size-3" />
                    Opsiyonel güven artırıcı alanlar
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-emerald-950">
                    İlanını daha güven verici hale getir
                  </h2>
                  <p className="max-w-2xl text-sm font-medium leading-6 text-emerald-900/80">
                    Ekspertiz, hasar ve Tramer detayları zorunlu değil. Ancak bu bilgileri eklemek
                    alıcıların ilanını daha hızlı değerlendirmesine yardımcı olur.
                  </p>
                </div>
                <Link
                  href="/dashboard/listings"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  İlanlarıma dön
                </Link>
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-200/80 bg-white/80 p-4 sm:p-5">
                <InspectionStep form={form} />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className="w-full rounded-xl py-4 font-semibold sm:w-auto sm:px-8"
            >
              <ChevronRight size={18} className="rotate-180" />
              Geri
            </Button>

            {currentStep === totalSteps - 1 ? (
              <div className="flex flex-col gap-4 sm:flex-row">
                {isBotProtectionEnabled && !isEditing && (
                  <div className="order-2 sm:order-1">
                    <BotProtection onVerify={setTurnstileToken} />
                  </div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    submitState.status === "idle" ||
                    Object.values(uploadStates).some((s) => s.status === "uploading")
                  }
                  className="w-full rounded-xl py-4 font-semibold sm:w-auto sm:px-8 order-1 sm:order-2"
                >
                  {submitState.status === "idle" ||
                  Object.values(uploadStates).some((s) => s.status === "uploading") ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      İncelemeye gönderiliyor...
                    </>
                  ) : isEditing ? (
                    "Güncellemeyi kaydet"
                  ) : (
                    "İncelemeye gönder"
                  )}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={handleNextStep}
                className="w-full rounded-xl py-4 font-semibold sm:w-auto sm:px-8"
              >
                İleri
                <ChevronRight size={18} />
              </Button>
            )}
          </div>

          {submitState.status === "error" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="font-semibold">Hata oluştu</span>
              </div>
              <p className="mt-1 text-sm">{submitState.message}</p>
            </div>
          )}

          {submitState.status === "warning" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span className="font-semibold">Uyarı</span>
              </div>
              <p className="mt-1 text-sm">{submitState.message}</p>
            </div>
          )}

          {submitState.status === "success" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span className="font-semibold">Başarılı</span>
              </div>
              <p className="mt-1 text-sm">{submitState.message}</p>
            </div>
          )}
        </form>

        <UploadProgress uploadStates={uploadStates} />

        <EmailVerificationDialog
          isOpen={isVerifyDialogOpen}
          onOpenChange={setIsVerifyDialogOpen}
          onSuccess={() => {
            setIsEmailVerifiedLocally(true);
            setIsVerifyDialogOpen(false);
          }}
        />
      </div>
    </div>
  );
}
