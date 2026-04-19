"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
  Car,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";

import {
  carPartDamageStatuses,
  carParts,
  maximumCarYear,
  minimumListingImages,
} from "@/lib/constants/domain";
import { listingCreateFormSchema } from "@/lib/validators";
import {
  validateListingImageFile,
} from "@/services/listings/listing-images";
import { lookupVehicleByPlate } from "@/services/listings/plate-lookup";
import type { BrandCatalogItem, CityOption, Listing, ListingCreateFormValues } from "@/types";

import { StepIndicator } from "./listing-wizard/StepIndicator";
import { VehicleInfoStep } from "./listing-wizard/steps/VehicleInfoStep";
import { DetailsStep } from "./listing-wizard/steps/DetailsStep";
import { InspectionStep } from "./listing-wizard/steps/InspectionStep";
import { PhotosStep } from "./listing-wizard/steps/PhotosStep";

interface ListingCreateFormProps {
  initialValues: {
    city: string;
    whatsappPhone: string;
  };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: Listing | null;
  isEmailVerified?: boolean;
}

interface SubmitState {
  message?: string;
  status: "error" | "idle" | "success";
}

interface UploadState {
  message?: string;
  previewUrl?: string;
  progress: number;
  status: "error" | "idle" | "uploaded" | "uploading";
}

interface UploadedImagePayload {
  image: {
    storagePath: string;
    url: string;
    placeholderBlur?: string | null;
  };
  message?: string;
}

const damageStatusAliases: Record<string, string> = {
  orijinal: "orjinal",
};

const carPartAliases: Record<string, string> = {
  soloncamurluk: "sol_on_camurluk",
  sagoncamurluk: "sag_on_camurluk",
  solarkacamurluk: "sol_arka_camurluk",
  sagarkacamurluk: "sag_arka_camurluk",
  solonkapi: "sol_on_kapi",
  sagonkapi: "sag_on_kapi",
  solarkakapi: "sol_arka_kapi",
  sagarkakapi: "sag_arka_kapi",
  ontampon: "on_tampon",
  arkatampon: "arka_tampon",
};

function normalizeDamagePartKey(key: string) {
  const normalized = key
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (carParts.includes(normalized as (typeof carParts)[number])) {
    return normalized;
  }

  const compact = normalized.replace(/_/g, "");
  return carPartAliases[compact] ?? null;
}

function normalizeDamageStatusValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const canonical = damageStatusAliases[normalized] ?? normalized;

  if (carPartDamageStatuses.includes(canonical as (typeof carPartDamageStatuses)[number])) {
    return canonical;
  }

  return null;
}

function normalizeDamageStatusJson(rawDamageStatusJson?: Record<string, unknown> | null) {
  if (!rawDamageStatusJson || typeof rawDamageStatusJson !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawDamageStatusJson)
      .map(([rawKey, rawValue]) => {
        const key = normalizeDamagePartKey(rawKey);
        const value = normalizeDamageStatusValue(rawValue);

        if (!key || !value || value === "orjinal") {
          return null;
        }

        return [key, value] as const;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  );
}

function buildDefaultValues(
  initialValues: ListingCreateFormProps["initialValues"],
  initialListing?: Listing | null,
): ListingCreateFormValues {
  const sortedImages = initialListing
    ? [...initialListing.images].sort((left, right) => left.order - right.order)
    : [];

  // DB'den gelen expertInspection JSONB null, undefined veya {} olabilir.
  // Tüm durumları normalize et — eksik alanları default değerlerle doldur.
  const rawInspection = initialListing?.expertInspection;
  const normalizedInspection = rawInspection && typeof rawInspection === "object" && Object.keys(rawInspection).length > 0
    ? {
        hasInspection: rawInspection.hasInspection ?? false,
        inspectionDate: rawInspection.inspectionDate ?? undefined,
        overallGrade: rawInspection.overallGrade ?? undefined,
        totalScore: rawInspection.totalScore ?? undefined,
        damageRecord: rawInspection.damageRecord ?? "bilinmiyor",
        bodyPaint: rawInspection.bodyPaint ?? "bilinmiyor",
        engine: rawInspection.engine ?? "bilinmiyor",
        transmission: rawInspection.transmission ?? "bilinmiyor",
        suspension: rawInspection.suspension ?? "bilinmiyor",
        brakes: rawInspection.brakes ?? "bilinmiyor",
        electrical: rawInspection.electrical ?? "bilinmiyor",
        interior: rawInspection.interior ?? "bilinmiyor",
        tires: rawInspection.tires ?? "bilinmiyor",
        acHeating: rawInspection.acHeating ?? "bilinmiyor",
        notes: rawInspection.notes ?? undefined,
        inspectedBy: rawInspection.inspectedBy ?? undefined,
        documentUrl: rawInspection.documentUrl ?? undefined,
        documentPath: rawInspection.documentPath ?? undefined,
      }
    : {
        hasInspection: false,
        damageRecord: "bilinmiyor" as const,
        bodyPaint: "bilinmiyor" as const,
        engine: "bilinmiyor" as const,
        transmission: "bilinmiyor" as const,
        suspension: "bilinmiyor" as const,
        brakes: "bilinmiyor" as const,
        electrical: "bilinmiyor" as const,
        interior: "bilinmiyor" as const,
        tires: "bilinmiyor" as const,
        acHeating: "bilinmiyor" as const,
      };

  return {
    title: initialListing?.title ?? "",
    brand: initialListing?.brand ?? "",
    model: initialListing?.model ?? "",
    carTrim: initialListing?.carTrim ?? null,
    year: initialListing?.year ?? Math.min(new Date().getFullYear(), maximumCarYear),
    mileage: initialListing?.mileage ?? 0,
    fuelType: initialListing?.fuelType ?? "benzin",
    transmission: initialListing?.transmission ?? "manuel",
    price: initialListing?.price ?? 0,
    city: initialListing?.city ?? initialValues.city,
    district: initialListing?.district ?? "",
    description: initialListing?.description ?? "",
    whatsappPhone: initialListing?.whatsappPhone ?? initialValues.whatsappPhone,
    licensePlate: initialListing?.licensePlate ?? "",
    vin: initialListing?.vin ?? "",
    tramerAmount: initialListing?.tramerAmount ?? 0,
    damageStatusJson: normalizeDamageStatusJson(initialListing?.damageStatusJson),
    images:
      sortedImages.length > 0
        ? sortedImages.map((image) => ({
            fileName: image.storagePath.split("/").pop(),
            storagePath: image.storagePath,
            url: image.url,
            placeholderBlur: image.placeholderBlur ?? null,
            imageType: (image.type === "360" ? "360" : "photo") as "photo" | "360",
          }))
        : Array.from({ length: minimumListingImages }, () => ({ imageType: "photo" as const })),
    expertInspection: normalizedInspection,
  };
}

function revokeBlobUrl(url?: string) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function uploadImageRequest(file: File, onProgress: (progress: number) => void) {
  return new Promise<UploadedImagePayload>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.set("file", file);
    xhr.open("POST", "/api/listings/images");
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    });

    xhr.addEventListener("load", () => {
      const payload = xhr.response as { success?: boolean; data?: { image: UploadedImagePayload["image"] }; error?: { message: string } } | null;
      if (xhr.status >= 200 && xhr.status < 300 && payload?.success && payload.data?.image) {
        resolve({ image: payload.data.image, message: "Fotoğraf yüklendi." });
        return;
      }
      reject(new Error(payload?.error?.message ?? "Fotoğraf yüklenemedi. Lütfen tekrar dene."));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene."));
    });

    xhr.send(formData);
  });
}

const initialSubmitState: SubmitState = {
  status: "idle",
};


const STEP_LABELS = [
  "Temel Bilgiler",
  "Konum ve Detaylar",
  "Ekspertiz ve Kondisyon",
  "Fotoğraflar ve Gönderim",
] as const;

import { EmailVerificationDialog } from "@/components/auth/email-verification-dialog";

export function ListingCreateForm({
  brands,
  cities,
  initialListing,
  initialValues,
  isEmailVerified = false,
}: ListingCreateFormProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const isEditing = Boolean(initialListing);
  // Email doğrulama — phone doğrulama kaldırıldı
  const [isEmailVerifiedLocally, setIsEmailVerifiedLocally] = useState(isEmailVerified);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = STEP_LABELS.length;
  const uploadStatesRef = useRef<Record<string, UploadState>>({});
  const pendingImageCleanupRef = useRef<Set<string>>(new Set());
  const submitIntentRef = useRef(false);
  const stepStartTimeRef = useRef<number>(Date.now());
  const hasTrackedWizardStart = useRef(false);
  
  const formValues = useMemo(
    () => buildDefaultValues(initialValues, initialListing),
    [initialListing, initialValues],
  );

  const form = useForm<ListingCreateFormValues, unknown, ListingCreateFormValues>({
    defaultValues: formValues,
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema as never),
  });

  const {
    control,
    clearErrors,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setError,
    setValue,
    trigger,
  } = form;

  const { append, fields, remove, move, insert, replace, swap, update, prepend } = useFieldArray({
    control,
    name: "images",
  });

  const selectedBrand = useWatch({ control, name: "brand" });
  const selectedCity = useWatch({ control, name: "city" });
  const plateValue = useWatch({ control, name: "licensePlate" });
  const isUploadingAnyImage = fields.some((field) => uploadStates[field.id]?.status === "uploading");

  const availableBrands = useMemo(() => {
    if (!initialListing?.brand) return brands;
    const existingBrand = brands.find((item) => item.brand === initialListing.brand);
    if (!existingBrand) {
      return [...brands, { 
        brand: initialListing.brand, 
        slug: initialListing.brand.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: initialListing.brand,
        models: initialListing.model ? [{ name: initialListing.model, trims: [] }] : [] 
      }].sort((l, r) => l.brand.localeCompare(r.brand, "tr"));
    }
    if (!initialListing.model || existingBrand.models.some(m => m.name === initialListing.model)) return brands;
    return brands.map((item) => item.brand === initialListing.brand ? { ...item, models: [...item.models, { name: initialListing.model as string, trims: [] }].sort((l, r) => l.name.localeCompare(r.name, "tr")) } : item);
  }, [brands, initialListing]);

  const availableCities = useMemo(() => {
    if (!initialListing?.city) return cities;
    const existingCity = cities.find((item) => item.city === initialListing.city);
    if (!existingCity) {
      return [...cities, { 
        city: initialListing.city, 
        slug: initialListing.city.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        cityPlate: null, 
        districts: initialListing.district ? [initialListing.district] : [] 
      }].sort((l, r) => l.city.localeCompare(r.city, "tr"));
    }
    if (!initialListing.district || existingCity.districts.includes(initialListing.district)) return cities;
    return cities.map((item) => item.city === initialListing.city ? { ...item, districts: [...item.districts, initialListing.district].sort((l, r) => l.localeCompare(r, "tr")) } : item);
  }, [cities, initialListing]);

  useEffect(() => {
    const nextModelOptions = availableBrands.find((item) => item.brand === selectedBrand)?.models ?? [];
    const currentModel = getValues("model");
    if (currentModel && !nextModelOptions.some(m => m.name === currentModel)) {
      setValue("model", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [availableBrands, getValues, selectedBrand, setValue]);

  useEffect(() => {
    const nextDistrictOptions = availableCities.find((item) => item.city === selectedCity)?.districts ?? [];
    const currentDistrict = getValues("district");
    if (currentDistrict && currentDistrict.length > 0 && !nextDistrictOptions.includes(currentDistrict)) {
      setValue("district", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [availableCities, getValues, selectedCity, setValue]);

  useEffect(() => {
    uploadStatesRef.current = uploadStates;
  }, [uploadStates]);

  useEffect(() => {
    reset(formValues);
  }, [formValues, reset]);

  useEffect(() => {
    submitIntentRef.current = false;
    stepStartTimeRef.current = Date.now();
  }, [currentStep]);

  // Track wizard start once
  useEffect(() => {
    if (!hasTrackedWizardStart.current) {
      hasTrackedWizardStart.current = true;
      trackEvent(AnalyticsEvent.LISTING_WIZARD_STARTED, {} as Record<string, never>);
    }
  }, [trackEvent]);

  // Track abandonment on unmount (if not submitted)
  useEffect(() => {
    return () => {
      if (submitState.status !== "success") {
        trackEvent(AnalyticsEvent.LISTING_WIZARD_ABANDONED, {
          lastStepName: STEP_LABELS[currentStep],
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      Object.values(uploadStatesRef.current).forEach((state) => {
        revokeBlobUrl(state.previewUrl);
      });
    };
  }, []);

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
        setValue("brand", result.brand, { shouldDirty: true, shouldValidate: true });
        setValue("model", result.model, { shouldDirty: true, shouldValidate: true });
        setValue("year", result.year, { shouldDirty: true, shouldValidate: true });
        setValue("fuelType", result.fuelType as ListingCreateFormValues["fuelType"], { shouldDirty: true, shouldValidate: true });
        setValue("transmission", result.transmission as ListingCreateFormValues["transmission"], { shouldDirty: true, shouldValidate: true });
        const brandLabel = availableBrands.find(b => b.brand === result.brand)?.brand || result.brand;
        setValue("title", `${result.year} ${brandLabel} ${result.model}`, { shouldDirty: true, shouldValidate: true });

        setSubmitState({ status: "success", message: "Araç bilgileri başarıyla getirildi ✨" });
        setTimeout(() => setSubmitState(initialSubmitState), 3000);
      } else {
        setError("licensePlate", { message: "Bu plaka ile araç bilgisi bulunamadı." });
      }
    } catch {
      setError("licensePlate", { message: "Sorgulama sırasında bir hata oluştu." });
    } finally {
      setIsPlateLoading(false);
    }
  };

  const handleNextStep = async () => {
    let fieldsToValidate: FieldPath<ListingCreateFormValues>[] = [];
    if (currentStep === 0) fieldsToValidate = ["brand", "model", "year", "mileage", "vin", "fuelType", "transmission"];
    if (currentStep === 1) fieldsToValidate = ["city", "district", "title", "description", "price", "whatsappPhone"];
    if (currentStep === 2) {
      fieldsToValidate = [
        "damageStatusJson",
        "tramerAmount",
        "expertInspection.hasInspection",
        "expertInspection.inspectionDate",
        "expertInspection.inspectedBy",
      ];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      const timeSpentSeconds = Math.round((Date.now() - stepStartTimeRef.current) / 1000);
      trackEvent(AnalyticsEvent.LISTING_WIZARD_STEP_COMPLETED, {
        stepName: STEP_LABELS[currentStep],
        stepIndex: currentStep,
        timeSpentSeconds,
      });
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUploadState = (fieldId: string, nextState: UploadState) => {
    setUploadStates((current) => ({ ...current, [fieldId]: nextState }));
  };

  const removeUploadedImage = async (storagePath?: string) => {
    if (!storagePath) return;
    try {
      await fetch("/api/listings/images", {
        body: JSON.stringify({ storagePath }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
    } catch {
      // Non-critical: storage cleanup failure should not block UX.
      // Orphaned images will be cleaned up by a periodic storage sweep if implemented.
    }
  };

  const queueImageCleanup = (storagePath?: string) => {
    if (!storagePath) return;
    pendingImageCleanupRef.current.add(storagePath);
  };

  const flushQueuedImageCleanup = async () => {
    const queuedPaths = [...pendingImageCleanupRef.current];
    pendingImageCleanupRef.current.clear();

    await Promise.allSettled(
      queuedPaths.map((storagePath) => removeUploadedImage(storagePath)),
    );
  };

  const handleImageChange = async (index: number, file: File | null) => {
    if (!file) return;
    const fieldId = fields[index].id;
    const fileError = await validateListingImageFile(file);
    if (fileError) {
      setError(`images.${index}.url` as FieldPath<ListingCreateFormValues>, { message: fileError, type: "validate" });
      updateUploadState(fieldId, { message: fileError, progress: 0, status: "error" });
      return;
    }
    const previousImage = getValues(`images.${index}`);
    updateUploadState(fieldId, { message: "Fotoğraf işleniyor...", progress: 0, status: "uploading" });
    
    let compressibleFile = file;
    let blurDataUrl: string | null = null;

    try {
      const { default: imageCompression } = await import("browser-image-compression");
      
      compressibleFile = await imageCompression(file, { 
        maxSizeMB: 0.8, 
        maxWidthOrHeight: 1600, 
        useWebWorker: false, // Web Worker CDN'den script yüklemeye çalışıyor — CSP ihlali
        fileType: "image/jpeg",
      });

      const blurFile = await imageCompression(file, {
        maxSizeMB: 0.005,
        maxWidthOrHeight: 20,
        useWebWorker: false,
      });
      blurDataUrl = await imageCompression.getDataUrlFromFile(blurFile);

    } catch {
      // Compression failed — upload original file
    }

    const previewUrl = URL.createObjectURL(compressibleFile);
    clearErrors(`images.${index}.url` as FieldPath<ListingCreateFormValues>);
    updateUploadState(fieldId, { message: "Yükleniyor...", previewUrl, progress: 0, status: "uploading" });

    try {
      const payload = await uploadImageRequest(compressibleFile, (progress) => {
        updateUploadState(fieldId, { message: "Yükleniyor...", previewUrl, progress, status: "uploading" });
      });
      revokeBlobUrl(previewUrl);

      if (previousImage?.storagePath && previousImage.storagePath !== payload.image.storagePath) {
        queueImageCleanup(previousImage.storagePath);
      }
      
      const nextImageValue = { 
        ...payload.image, 
        placeholderBlur: blurDataUrl 
      };

      setValue(`images.${index}`, nextImageValue, { shouldDirty: true, shouldValidate: true });
      updateUploadState(fieldId, { 
        message: "Tamamlandı", 
        previewUrl: nextImageValue.url, 
        progress: 100, 
        status: "uploaded" 
      });
    } catch (uploadError) {
      revokeBlobUrl(previewUrl);
      const message = uploadError instanceof Error ? uploadError.message : "Yükleme hatası.";
      setError(`images.${index}.url` as FieldPath<ListingCreateFormValues>, { message, type: "validate" });
      // Hata state'i: previewUrl yok, retry için input tekrar aktif
      updateUploadState(fieldId, { message, progress: 0, status: "error" });
    }
  };

  const handleRemoveImage = (index: number) => {
    const fieldId = fields[index].id;
    const currentImage = getValues(`images.${index}`);
    if (currentImage?.storagePath) {
      queueImageCleanup(currentImage.storagePath);
    }
    revokeBlobUrl(uploadStates[fieldId]?.previewUrl);
    
    const nextStates = { ...uploadStates };
    delete nextStates[fieldId];
    setUploadStates(nextStates);
    
    // Resim alanını temizle — shouldValidate: false ile validation tetiklenmesin
    setValue(`images.${index}`, { fileName: "", storagePath: "", url: "" }, { shouldDirty: true, shouldValidate: false });
  };

  const submitListing = async (values: ListingCreateFormValues) => {
    clearErrors();
    setSubmitState(initialSubmitState);

    try {
      const response = await fetch(isEditing ? `/api/listings/${initialListing?.id}` : "/api/listings", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: isEditing ? "PATCH" : "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        // Handle field-level validation errors from API
        const fieldErrors = payload?.error?.fieldErrors as Record<string, string> | undefined;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([field, message]) => {
            setError(field as Parameters<typeof setError>[0], { message });
          });
        }
        trackEvent(AnalyticsEvent.LISTING_SUBMITTED, {
          listingId: initialListing?.id ?? "unknown",
          brand: getValues("brand"),
          model: getValues("model"),
          price: getValues("price"),
        });
        setSubmitState({ message: payload?.error?.message ?? "Bir hata oluştu.", status: "error" });
        return;
      }

      setSubmitState({
        message: isEditing
          ? "İlan güncellendi."
          : "İlanın kaydedildi ve moderasyon incelemesine gönderildi.",
        status: "success",
      });
      if (isEditing) {
        trackEvent(AnalyticsEvent.LISTING_UPDATED, {
          listingId: payload?.data?.listing?.id ?? initialListing?.id ?? "unknown",
        });
      } else {
        trackEvent(AnalyticsEvent.LISTING_SUBMITTED, {
          listingId: payload?.data?.listing?.id ?? "unknown",
          brand: getValues("brand"),
          model: getValues("model"),
          price: getValues("price"),
        });
      }

      void flushQueuedImageCleanup();

      if (isEditing) {
        router.replace("/dashboard/listings?updated=true");
        return;
      }

      router.push("/dashboard/listings?created=pending");
    } catch {
      // Network error — no typed event for failures, use raw capture
      // (these are operational, not product analytics)
      setSubmitState({ message: "Bağlantı hatası.", status: "error" });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    // Edit modunda email verification bypass — zaten ilan sahibi doğrulanmış
    if (!isEmailVerifiedLocally && !isEditing) {
      setIsVerifyDialogOpen(true);
      return;
    }

    await submitListing(values);
  }, (validationErrors) => {
    // Validation başarısız — hangi adımda hata var, oraya git
    const errorFields = Object.keys(validationErrors);
    const step0Fields = ["brand", "model", "year", "mileage", "vin", "fuelType", "transmission"];
    const step1Fields = ["city", "district", "title", "description", "price", "whatsappPhone"];
    const step2Fields = ["damageStatusJson", "tramerAmount", "expertInspection"];

    if (errorFields.some(f => step0Fields.includes(f))) {
      setCurrentStep(0);
    } else if (errorFields.some(f => step1Fields.includes(f))) {
      setCurrentStep(1);
    } else if (errorFields.some(f => step2Fields.some(s => f.startsWith(s)))) {
      setCurrentStep(2);
    }

    // Hata mesajını göster
    const firstError = Object.values(validationErrors)[0];
    const message = (firstError as { message?: string })?.message ?? "Lütfen tüm zorunlu alanları doldurun.";
    setSubmitState({ message, status: "error" });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="mx-auto min-h-screen w-full flex-1 bg-slate-50/50 px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 border border-slate-200 shadow-sm">
            <Car size={12} strokeWidth={3} />
            Satış Yolculuğu
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 lg:text-6xl">
            {isEditing ? "İlanı Güncelle" : "Arabanı Satışa Çıkar"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-bold text-slate-400">
            {isEditing
              ? "Araç bilgilerini güncelleyerek ilanını taze tut. Değişiklikler uzman ekibimiz tarafından incelenecektir."
              : "Hızlı, güvenli ve kolayca ilan ver. Doğru alıcıyla dakikalar içinde buluş."}
          </p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <form onSubmit={handleFormSubmit} className="mt-16">
          <div className="relative rounded-[2.5rem] border border-white bg-white p-6 shadow-2xl shadow-slate-200/60 lg:p-12">
            
            {/* Step Corner Badge */}
            <div className="absolute -right-3 -top-3 hidden lg:flex size-20 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/30 transform transition-transform hover:scale-110">
              <div className="flex flex-col items-center leading-none">
                <span className="text-[10px] uppercase font-black opacity-60 mb-1">Adım</span>
                <span className="text-3xl font-black">{currentStep + 1}</span>
              </div>
            </div>

            <div className="space-y-8">
              {submitState.status === "success" && submitState.message && (
                <div className="flex items-center gap-4 rounded-3xl bg-emerald-50 p-6 border border-emerald-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={24} strokeWidth={3} />
                  </div>
                  <p className="text-base font-black text-emerald-900 tracking-tight">{submitState.message}</p>
                </div>
              )}

              {submitState.status === "error" && submitState.message && (
                <div className="flex items-center gap-4 rounded-3xl bg-rose-50 p-6 border border-rose-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                    <AlertCircle size={24} strokeWidth={3} />
                  </div>
                  <p className="text-base font-black text-rose-900 tracking-tight">{submitState.message}</p>
                </div>
              )}

              {errors.root && (
                <div className="flex items-center gap-4 rounded-3xl bg-rose-50 p-6 border border-rose-100 shadow-sm">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                    <AlertCircle size={24} strokeWidth={3} />
                  </div>
                  <p className="text-base font-black text-rose-900 tracking-tight">{errors.root.message}</p>
                </div>
              )}

              <div className="min-h-[400px]">
          {currentStep === 0 && (
            <VehicleInfoStep 
              form={form} 
              brands={availableBrands} 
              isPlateLoading={isPlateLoading} 
              onPlateLookup={handlePlateLookup} 
            />
          )}
          
          {currentStep === 1 && (
            <DetailsStep 
              form={form} 
              cities={availableCities} 
            />
          )}

          {currentStep === 2 && (
            <InspectionStep 
              form={form} 
            />
          )}

          {currentStep === 3 && (
            <PhotosStep 
              form={form} 
              fieldArray={{ append, fields, remove, move, insert, replace, swap, update, prepend }}
              uploadStates={uploadStates}
              onImageChange={handleImageChange}
              onRemoveImage={handleRemoveImage}
            />
          )}
        </div>
      </div>

            {/* Navigation Controls - Fixed Bottom Bar Feel */}
            <div className="mt-12 flex h-24 items-center justify-between border-t border-slate-100 pt-8 lg:mt-16">
              <div>
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:text-slate-900 active:scale-95 disabled:opacity-30"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    Geri Dön
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                {currentStep < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex h-14 items-center gap-3 rounded-2xl bg-slate-900 px-10 text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-slate-900/30 transition-all hover:bg-black hover:scale-105 active:scale-95"
                  >
                    Sonraki Adım
                    <ChevronRight size={18} strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    onClick={() => (submitIntentRef.current = true)}
                    disabled={isSubmitting || isUploadingAnyImage}
                    className="flex h-16 items-center gap-4 rounded-2xl bg-blue-600 px-12 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-600/30 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="animate-spin" size={20} strokeWidth={3} />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        {isEditing ? "Değişiklikleri Kaydet" : "İlanı Yayınla"}
                        <ShieldCheck size={22} strokeWidth={3} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <p className="mt-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest opacity-60">
          Güvenli Altyapı — OtoBurada Marketplace
        </p>
      </div>

      <EmailVerificationDialog
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onSuccess={() => {
          setIsEmailVerifiedLocally(true);
          void submitListing(getValues());
        }}
      />
    </div>
  );
}
