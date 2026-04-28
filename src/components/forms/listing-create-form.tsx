"use client";
import { AlertCircle, Car, CheckCircle2, ChevronRight, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";
import { BotProtection } from "@/components/shared/bot-protection";
// Feature Hook
import { useListingCreation } from "@/features/listing-creation/hooks/use-listing-creation";
import { type BrandCatalogItem, type CityOption, type Listing } from "@/types";

import { StepIndicator } from "./listing-wizard/StepIndicator";
import { DetailsStep } from "./listing-wizard/steps/DetailsStep";
import { InspectionStep } from "./listing-wizard/steps/InspectionStep";
import { PhotosStep } from "./listing-wizard/steps/PhotosStep";
import { VehicleInfoStep } from "./listing-wizard/steps/VehicleInfoStep";

interface ListingCreateFormProps {
  initialValues: { city: string; whatsappPhone: string };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: Listing | null;
  isEmailVerified?: boolean;
}

export function ListingCreateForm({
  brands,
  cities,
  initialListing,
  initialValues,
  isEmailVerified = false,
}: ListingCreateFormProps) {
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
    isApprovedEditing,
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
            {isEditing
              ? isApprovedEditing
                ? "İlanı Güncelle (Kısıtlı Mod)"
                : "İlanı Güncelle"
              : "İlan Ver"}
          </h1>
          {isApprovedEditing && (
            <p className="mt-4 text-xs font-medium text-amber-600 bg-amber-50 py-2 px-4 rounded-full inline-block">
              Yayındaki ilanlarda SEO yapısını korumak için sadece fiyat ve açıklama
              değiştirilebilir.
            </p>
          )}
        </div>

        <StepIndicator currentStep={currentStep} />

        <form onSubmit={handleFormSubmit} className="mt-16">
          <div className="relative rounded-2xl border border-white bg-white p-6 shadow-sm shadow-slate-200/60 lg:p-12">
            <div className="absolute -right-3 -top-3 hidden lg:flex size-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-sm shadow-slate-900/30">
              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] uppercase font-bold opacity-60 mb-1">Adım</span>
                <span className="text-3xl font-bold">{currentStep + 1}</span>
              </div>
            </div>

            <div className="space-y-8">
              {submitState.status === "success" && submitState.message && (
                <div className="flex items-center gap-4 rounded-3xl bg-emerald-50 p-6 border border-emerald-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                    <CheckCircle2 size={24} strokeWidth={3} />
                  </div>
                  <p className="text-base font-bold text-emerald-900 tracking-tight">
                    {submitState.message}
                  </p>
                </div>
              )}

              {submitState.status === "error" && submitState.message && (
                <div className="flex items-center gap-4 rounded-3xl bg-rose-50 p-6 border border-rose-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm shadow-rose-500/30">
                    <AlertCircle size={24} strokeWidth={3} />
                  </div>
                  <p className="text-base font-bold text-rose-900 tracking-tight">
                    {submitState.message}
                  </p>
                </div>
              )}

              {submitState.status === "warning" && submitState.message && (
                <div className="flex flex-col gap-4 rounded-3xl bg-amber-50 p-6 border border-amber-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-500/30">
                      <AlertCircle size={24} strokeWidth={3} />
                    </div>
                    <p className="text-base font-bold text-amber-900 tracking-tight">
                      {submitState.message}
                    </p>
                  </div>
                  {(submitState.code === "CONFLICT" ||
                    submitState.code === "RATE_LIMITED" ||
                    submitState.code === "TURNSTILE_REQUIRED") && (
                    <div className="flex justify-end px-2">
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors underline decoration-2 underline-offset-4"
                      >
                        Sayfayı Yenile
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="min-h-[400px]">
                {currentStep === 0 && (
                  <VehicleInfoStep
                    form={form}
                    brands={brands}
                    isPlateLoading={isPlateLoading}
                    onPlateLookup={handlePlateLookup}
                    isDisabled={isApprovedEditing}
                  />
                )}
                {currentStep === 1 && (
                  <DetailsStep form={form} cities={cities} isPartialDisabled={isApprovedEditing} />
                )}
                {currentStep === 2 && <InspectionStep form={form} isDisabled={isApprovedEditing} />}
                {currentStep === 3 && (
                  <>
                    <PhotosStep
                      form={form}
                      fieldArray={fieldArray}
                      uploadStates={uploadStates}
                      onImageChange={handleImageChange}
                      onRemoveImage={handleRemoveImage}
                      isDisabled={isApprovedEditing}
                    />
                    <div className="mt-8 flex justify-center">
                      <BotProtection onVerify={setTurnstileToken} />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-10">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:grayscale uppercase tracking-widest"
                >
                  Geri Dön
                </button>

                {currentStep === totalSteps - 1 ? (
                  <button
                    type="submit"
                    onClick={() => {
                      submitIntentRef.current = true;
                    }}
                    disabled={form.formState.isSubmitting}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-10 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50 uppercase tracking-widest"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <LoaderCircle className="size-5 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-5" />
                        Tüm Bilgileri Kaydet
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-10 text-sm font-bold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-slate-800 uppercase tracking-widest group"
                  >
                    Sonraki Adım
                    <ChevronRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <EmailVerificationDialog
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onSuccess={() => {
          setIsEmailVerifiedLocally(true);
          void onSubmit();
        }}
      />
    </div>
  );
}
