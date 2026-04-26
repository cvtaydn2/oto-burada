"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { type FieldPath, useFieldArray, useForm, useWatch } from "react-hook-form";

import { useAnalytics } from "@/hooks/use-analytics";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { listingCreateFormSchema } from "@/lib/validators";
import { validateListingImageFile } from "@/services/listings/listing-images";
import { ListingService } from "@/services/listings/listing-service";
import { lookupVehicleByPlate } from "@/services/listings/plate-lookup";
import {
  type BrandCatalogItem,
  type CityOption,
  type Listing,
  type ListingCreateFormValues,
} from "@/types";
import { type ApiResponse } from "@/types/errors";

import { buildDefaultValues } from "../utils/form-utils";

interface UseListingCreationProps {
  initialValues: { city: string; whatsappPhone: string };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: Listing | null;
  isEmailVerified: boolean;
}

const STEP_LABELS = [
  "Araç Bilgileri",
  "Fiyat ve İletişim",
  "Ekspertiz (İsteğe Bağlı)",
  "Fotoğraflar",
];

export function useListingCreation({
  initialValues,
  initialListing,
  isEmailVerified,
}: UseListingCreationProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const isEditing = Boolean(initialListing);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitState, setSubmitState] = useState<{
    status: "error" | "idle" | "success" | "warning";
    message?: string;
    code?: string;
  }>({ status: "idle" });
  const [uploadStates, setUploadStates] = useState<
    Record<string, { status: string; progress: number; message: string; previewUrl?: string }>
  >({});
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [isEmailVerifiedLocally, setIsEmailVerifiedLocally] = useState(isEmailVerified);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  const stepStartTimeRef = useRef<number>(Date.now());
  const submitIntentRef = useRef(false);
  const pendingImageCleanupRef = useRef<Set<string>>(new Set());

  const formDefaultValues = useMemo(
    () => buildDefaultValues(initialValues, initialListing),
    [initialListing, initialValues]
  );

  const form = useForm<ListingCreateFormValues>({
    defaultValues: formDefaultValues,
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema as never),
  });

  const { control, trigger, getValues, setValue, setError, clearErrors } = form;

  const mapSubmitError = useCallback(
    (payload: ApiResponse<unknown>) => {
      const apiError = payload.error;
      const errorCode = apiError?.code;
      const details = apiError?.details as Record<string, unknown> | undefined;

      if (errorCode === "CONFLICT") {
        const conflictType = details?.conflictType;
        const resolution = details?.resolution;

        return {
          status: "warning" as const,
          code: errorCode,
          message:
            conflictType === "concurrent_update_detected" || resolution === "reload_required"
              ? "İlan bu sırada başka bir yerde güncellendi. Formdaki verileriniz korundu. Kontrol edip sayfayı yenileyerek tekrar deneyin."
              : (apiError?.message ??
                "Çakışan bir güncelleme tespit edildi. Lütfen tekrar deneyin."),
        };
      }

      if (errorCode === "VALIDATION_ERROR") {
        if (details) {
          Object.entries(details).forEach(([key, messages]) => {
            const fieldKey = key as FieldPath<ListingCreateFormValues>;
            setError(fieldKey, { message: (messages as string[])[0] });
          });
        }
        return {
          status: "warning" as const,
          code: errorCode,
          message: apiError?.message ?? "Bazı alanları kontrol edip yeniden deneyin.",
        };
      }

      if (errorCode === "FORBIDDEN") {
        return {
          status: "error" as const,
          code: errorCode,
          message: apiError?.message ?? "Bu işlem şu anda güvenlik nedeniyle tamamlanamıyor.",
        };
      }

      if (errorCode === "RATE_LIMITED") {
        return {
          status: "warning" as const,
          code: errorCode,
          message:
            apiError?.message ?? "Çok sık deneme yaptınız. Lütfen biraz sonra tekrar deneyin.",
        };
      }

      if (errorCode === "SERVICE_UNAVAILABLE") {
        return {
          status: "error" as const,
          code: errorCode,
          message:
            apiError?.message ?? "Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        };
      }

      return {
        status: "error" as const,
        code: errorCode || "UNKNOWN_ERROR",
        message: apiError?.message ?? "Bir hata oluştu.",
      };
    },
    [setError]
  );

  const fieldArray = useFieldArray({ control, name: "images" });
  const { fields } = fieldArray;

  const plateValue = useWatch({ control, name: "licensePlate" });

  // Wizard Navigation
  const handleNextStep = useCallback(async () => {
    let fieldsToValidate: FieldPath<ListingCreateFormValues>[] = [];
    if (currentStep === 0)
      fieldsToValidate = [
        "category",
        "brand",
        "model",
        "year",
        "mileage",
        "vin",
        "fuelType",
        "transmission",
      ];
    if (currentStep === 1)
      fieldsToValidate = ["city", "district", "title", "description", "price", "whatsappPhone"];

    const isValid = fieldsToValidate.length === 0 || (await trigger(fieldsToValidate));
    if (isValid) {
      const timeSpentSeconds = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      trackEvent(AnalyticsEvent.LISTING_WIZARD_STEP_COMPLETED, {
        stepName: STEP_LABELS[currentStep],
        stepIndex: currentStep,
        timeSpentSeconds,
      });
      setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep, trigger, trackEvent]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Plate Lookup
  const handlePlateLookup = async () => {
    const plate = (plateValue || "").replace(/\s/g, "").toUpperCase();
    if (plate.length < 5) {
      setError("licensePlate", { message: "Lütfen geçerli bir plaka gir" });
      return;
    }
    setIsPlateLoading(true);
    clearErrors("licensePlate");
    try {
      const result = await lookupVehicleByPlate(plate);
      if (result) {
        const currentValues = getValues();
        const mismatchFields = [
          currentValues.brand && currentValues.brand !== result.brand ? "marka" : null,
          currentValues.model && currentValues.model !== result.model ? "model" : null,
          currentValues.year && currentValues.year !== result.year ? "yıl" : null,
          currentValues.fuelType && currentValues.fuelType !== result.fuelType ? "yakıt" : null,
          currentValues.transmission && currentValues.transmission !== result.transmission
            ? "vites"
            : null,
        ].filter(Boolean) as string[];

        setValue("brand", result.brand, { shouldDirty: true, shouldValidate: true });
        setValue("model", result.model, { shouldDirty: true, shouldValidate: true });
        setValue("year", result.year, { shouldDirty: true, shouldValidate: true });
        setValue("fuelType", result.fuelType as ListingCreateFormValues["fuelType"], {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("transmission", result.transmission as ListingCreateFormValues["transmission"], {
          shouldDirty: true,
          shouldValidate: true,
        });

        if (mismatchFields.length > 0) {
          setSubmitState({
            status: "warning",
            message: `Plakadan gelen öneri ile girdiğiniz ${mismatchFields.join(", ")} bilgileri farklıydı. Alanları kontrol edip doğru olanı siz seçin.`,
          });
        } else {
          setSubmitState({
            status: "success",
            message:
              "Plakadan tahmini araç bilgileri öneri olarak dolduruldu. Resmi kayıt doğrulaması değildir.",
          });
        }

        setTimeout(() => setSubmitState({ status: "idle" }), 3000);
      } else {
        setError("licensePlate", {
          message: "Bu plaka için öneri üretilemedi. Araç bilgilerini manuel girin.",
        });
      }
    } catch {
      setError("licensePlate", {
        message: "Plaka önerisi alınamadı. Araç bilgilerini manuel girin.",
      });
    } finally {
      setIsPlateLoading(false);
    }
  };

  // Image Upload Logic
  const handleImageChange = async (index: number, file: File | null) => {
    if (!file) return;
    const fieldId = fields[index].id;
    const fileError = await validateListingImageFile(file);
    if (fileError) {
      setError(`images.${index}.url` as FieldPath<ListingCreateFormValues>, { message: fileError });
      setUploadStates((prev) => ({
        ...prev,
        [fieldId]: { message: fileError, progress: 0, status: "error" },
      }));
      return;
    }

    setUploadStates((prev) => ({
      ...prev,
      [fieldId]: { message: "Yükleniyor...", progress: 0, status: "uploading" },
    }));

    try {
      const { default: imageCompression } = await import("browser-image-compression");
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: false,
      });
      const blurFile = await imageCompression(file, {
        maxSizeMB: 0.005,
        maxWidthOrHeight: 20,
        useWebWorker: false,
      });
      const blurDataUrl = await imageCompression.getDataUrlFromFile(blurFile);

      const formData = new FormData();
      formData.append("file", compressedFile);

      // Manual XHR for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/listings/images");
      xhr.responseType = "json";
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadStates((prev) => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], progress: Math.round((e.loaded / e.total) * 100) },
          }));
        }
      };

      const payload = await new Promise<{
        success: boolean;
        data: { image: { url: string; storagePath: string; fileName: string } };
      }>((resolve, reject) => {
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error("Yükleme hatası"));
        xhr.send(formData);
      });

      if (payload.success) {
        const nextImage = { ...payload.data.image, placeholderBlur: blurDataUrl };
        setValue(`images.${index}`, nextImage, { shouldDirty: true, shouldValidate: true });
        setUploadStates((prev) => ({
          ...prev,
          [fieldId]: {
            message: "Tamamlandı",
            progress: 100,
            status: "uploaded",
            previewUrl: nextImage.url,
          },
        }));
      }
    } catch {
      setUploadStates((prev) => ({
        ...prev,
        [fieldId]: { message: "Yükleme başarısız", progress: 0, status: "error" },
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    const fieldId = fields[index].id;
    const currentPath = getValues(`images.${index}.storagePath`);
    if (currentPath) pendingImageCleanupRef.current.add(currentPath);

    setUploadStates((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setValue(`images.${index}`, { fileName: "", storagePath: "", url: "" }, { shouldDirty: true });
  };

  const submitListing = async (values: ListingCreateFormValues, turnstileToken?: string) => {
    setSubmitState({ status: "idle" });
    const payload = { ...values, turnstileToken } as Record<string, unknown>;

    const response = isEditing
      ? await ListingService.updateListing(initialListing!.id, payload)
      : await ListingService.createListing(payload);

    if (!response.success) {
      if (response.error?.code === "CONFLICT") {
        const shouldReload = window.confirm(
          "Bu ilan başka bir yerde güncellendi. Formdaki verileriniz korunuyor. En güncel halini görmek için sayfayı şimdi yenilemek ister misiniz?"
        );

        if (shouldReload) {
          window.location.reload();
          return;
        }
      }
      setSubmitState(mapSubmitError(response));
      return;
    }

    setSubmitState({ status: "success", message: "İlan başarıyla kaydedildi." });
    trackEvent(isEditing ? AnalyticsEvent.LISTING_UPDATED : AnalyticsEvent.LISTING_SUBMITTED, {
      listingId: response.data!.listing.id,
    });
    router.push("/dashboard/listings?created=pending");
  };

  return {
    form,
    fieldArray,
    currentStep,
    setCurrentStep,
    totalSteps: STEP_LABELS.length,
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
    setSubmitState, // Exported to allow manual state updates from the form
    submitIntentRef,
  };
}
