"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type FieldPath, useFieldArray, useForm, useWatch } from "react-hook-form";

import { validateListingImageFile } from "@/features/marketplace/services/listing-images";
import { lookupVehicleByPlate } from "@/features/marketplace/services/plate-lookup";
import { useAnalytics } from "@/hooks/use-analytics";
import { listingCreateFormSchema } from "@/lib";
import { ApiClient } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/constants/api-routes";
import { AnalyticsEvent } from "@/lib/events";
import { apiResponseSchemas } from "@/lib/validators/api-responses";
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
  successRedirectPath?: string;
}

const STEP_LABELS = ["Araç Bilgileri", "İlan Detayları", "Fotoğraflar"] as const;
const TOTAL_STEPS = STEP_LABELS.length;
const DRAFT_STORAGE_KEY = "oto_burada_listing_draft_v2";

function normalizeDraftStep(step: number) {
  if (step <= 0) {
    return 0;
  }

  if (step >= TOTAL_STEPS - 1) {
    return TOTAL_STEPS - 1;
  }

  return step;
}

export function useListingCreation({
  initialValues,
  initialListing,
  isEmailVerified,
  successRedirectPath,
}: UseListingCreationProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const isEditing = Boolean(initialListing);
  const isApprovedEditing = initialListing?.status === "approved";

  const [currentStep, setCurrentStep] = useState(0);
  const [submitState, setSubmitState] = useState<{
    status: "error" | "idle" | "success" | "warning";
    message?: string;
    code?: string;
    showReloadPrompt?: boolean;
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

  const { control, trigger, getValues, setValue, setError, clearErrors, watch, reset } = form;

  // ── DRAFT PERSISTENCE ──
  // Draft schema for validation (memoized to avoid lint warning)
  const draftSchema = useMemo(
    () => ({
      timestamp: (val: unknown): val is number =>
        typeof val === "number" && Number.isFinite(val) && val > 0,
      step: (val: unknown): val is number =>
        typeof val === "number" && Number.isInteger(val) && val >= 0 && val <= 3,
      values: (val: unknown): val is Record<string, unknown> =>
        typeof val === "object" && val !== null && !Array.isArray(val),
    }),
    []
  );

  // Load draft on mount
  useEffect(() => {
    if (isEditing) return;

    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        // Validate draft structure
        if (
          draftSchema.timestamp(parsed.timestamp) &&
          draftSchema.step(parsed.step) &&
          draftSchema.values(parsed.values)
        ) {
          // Only restore if the draft isn't too old (e.g., < 24h)
          const age = Date.now() - parsed.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            reset({ ...formDefaultValues, ...parsed.values });
            setCurrentStep(normalizeDraftStep(parsed.step));
          } else {
            // Expired draft - clean up
            localStorage.removeItem(DRAFT_STORAGE_KEY);
          }
        } else {
          // Invalid draft structure - clean up to prevent future issues
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn("Failed to load listing draft", err);
      // Corrupted draft - clean up
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [isEditing, reset, formDefaultValues, draftSchema]);

  // Save draft on change
  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedValues = watch();
  useEffect(() => {
    if (isEditing) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            values: watchedValues,
            step: normalizeDraftStep(currentStep),
            timestamp: Date.now(),
          })
        );
      } catch (err) {
        console.warn("Failed to save listing draft", err);
      }
    }, 1000); // Debounce save

    return () => clearTimeout(timeoutId);
  }, [watchedValues, currentStep, isEditing]);

  // ── STORAGE CLEANUP ──
  useEffect(() => {
    const pendingCleanup = pendingImageCleanupRef.current;

    const cleanupOrphanedImages = () => {
      if (!submitIntentRef.current && pendingCleanup.size > 0) {
        const paths = Array.from(pendingCleanup);
        // Use sendBeacon for reliable cleanup on page unload
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ paths })], { type: "application/json" });
          navigator.sendBeacon("/api/listings/images/cleanup", blob);
        } else {
          // Fallback to fetch
          ApiClient.request("/api/listings/images/cleanup", {
            method: "POST",
            body: JSON.stringify({ paths }),
          }).catch((err) => console.warn("Background storage cleanup failed", err));
        }
      }
    };

    // Cleanup on component unmount and page navigation/close
    window.addEventListener("unload", cleanupOrphanedImages);
    return () => {
      cleanupOrphanedImages();
      window.removeEventListener("unload", cleanupOrphanedImages);
    };
  }, []);

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

    const isValid =
      fieldsToValidate.length === 0 ||
      (await trigger(fieldsToValidate, {
        shouldFocus: true,
      }));
    if (isValid) {
      const timeSpentSeconds = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      trackEvent(AnalyticsEvent.LISTING_WIZARD_STEP_COMPLETED, {
        stepName: STEP_LABELS[currentStep],
        stepIndex: currentStep,
        timeSpentSeconds,
      });
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
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
    if (!isEmailVerifiedLocally) {
      setIsVerifyDialogOpen(true);
      setSubmitState({
        status: "error",
        message: "İlan oluşturmak için e-posta adresinizi doğrulamanız gerekiyor.",
      });
      return;
    }

    setSubmitState({ status: "idle" });
    const payload = { ...values, turnstileToken } as Record<string, unknown>;

    const response = isEditing
      ? await ApiClient.request<{
          listing: { id: string; slug: string; status: string; title: string };
        }>(API_ROUTES.LISTINGS.DETAIL(initialListing!.id), {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await ApiClient.request<{
          message: string;
          listing: { id: string; slug: string; status: string };
        }>(API_ROUTES.LISTINGS.BASE, {
          method: "POST",
          body: JSON.stringify(payload),
          schema: apiResponseSchemas.listingCreate,
        });

    if (!response.success) {
      if (response.error?.code === "CONFLICT") {
        setSubmitState({
          status: "warning",
          code: "CONFLICT",
          message: "Bu ilan başka bir yerde güncellendi. Formdaki verileriniz korunuyor.",
          showReloadPrompt: true,
        });
        return;
      }
      setSubmitState(mapSubmitError(response));
      return;
    }

    setSubmitState({
      status: "success",
      message: isEditing
        ? "İlan güncellemeniz kaydedildi. Moderasyon ekibi değişiklikleri inceleyip yayına devam ettirecek."
        : "İlanınız incelemeye alındı. Moderasyon kontrolünden sonra yayına açılacak.",
    });
    submitIntentRef.current = true; // Signal for cleanup effect

    // Clear draft on success
    if (!isEditing) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    const nextListingId = response.data!.listing.id;

    trackEvent(isEditing ? AnalyticsEvent.LISTING_UPDATED : AnalyticsEvent.LISTING_SUBMITTED, {
      listingId: nextListingId,
    });

    if (isEditing) {
      router.push(successRedirectPath ?? "/dashboard/listings?updated=true");
      return;
    }

    router.push(`/dashboard/listings?created=pending&listing=${nextListingId}`);
  };

  return {
    form,
    fieldArray,
    currentStep,
    setCurrentStep,
    totalSteps: TOTAL_STEPS,
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
    setSubmitState, // Exported to allow manual state updates from the form
    submitIntentRef,
  };
}
