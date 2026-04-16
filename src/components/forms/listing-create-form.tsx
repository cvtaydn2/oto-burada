"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";

import {
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
  isPhoneVerified?: boolean; // kept for backward compat
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

function buildDefaultValues(
  initialValues: ListingCreateFormProps["initialValues"],
  initialListing?: Listing | null,
): ListingCreateFormValues {
  const sortedImages = initialListing
    ? [...initialListing.images].sort((left, right) => left.order - right.order)
    : [];

  return {
    title: initialListing?.title ?? "",
    brand: initialListing?.brand ?? "",
    model: initialListing?.model ?? "",
    year: initialListing?.year ?? Math.min(new Date().getFullYear(), maximumCarYear),
    mileage: initialListing?.mileage ?? 0,
    fuelType: initialListing?.fuelType ?? "benzin",
    transmission: initialListing?.transmission ?? "manuel",
    price: initialListing?.price ?? 0,
    city: initialListing?.city ?? initialValues.city,
    district: initialListing?.district ?? "",
    description: initialListing?.description ?? "",
    whatsappPhone: initialListing?.whatsappPhone ?? initialValues.whatsappPhone,
    vin: initialListing?.vin ?? "",
    tramerAmount: initialListing?.tramerAmount ?? 0,
    damageStatusJson: initialListing?.damageStatusJson ?? {},
    images:
      sortedImages.length > 0
        ? sortedImages.map((image) => ({
            fileName: image.storagePath.split("/").pop(),
            storagePath: image.storagePath,
            url: image.url,
          }))
        : Array.from({ length: minimumListingImages }, () => ({})),
    expertInspection: initialListing?.expertInspection ?? {
      hasInspection: false,
      damageRecord: "bilinmiyor",
      bodyPaint: "bilinmiyor",
      engine: "bilinmiyor",
      transmission: "bilinmiyor",
      suspension: "bilinmiyor",
      brakes: "bilinmiyor",
      electrical: "bilinmiyor",
      interior: "bilinmiyor",
      tires: "bilinmiyor",
      acHeating: "bilinmiyor",
    },
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

import { PhoneVerificationDialog } from "@/components/auth/phone-verification-dialog";

export function ListingCreateForm({
  brands,
  cities,
  initialListing,
  initialValues,
  isPhoneVerified = false,
  isEmailVerified = false,
}: ListingCreateFormProps) {
  const router = useRouter();
  const posthog = usePostHog();
  const isEditing = Boolean(initialListing);
  // Email doğrulama — phone doğrulama kaldırıldı
  const [isEmailVerifiedLocally, setIsEmailVerifiedLocally] = useState(isEmailVerified || isPhoneVerified);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = STEP_LABELS.length;
  const uploadStatesRef = useRef<Record<string, UploadState>>({});
  
  const form = useForm<ListingCreateFormValues, unknown, ListingCreateFormValues>({
    defaultValues: buildDefaultValues(initialValues, initialListing),
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema as never),
  });

  const {
    control,
    clearErrors,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
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
  const imageValues = useWatch({ control, name: "images" }) ?? [];
  const uploadedImageCount = imageValues.filter(
    (image) => (image.url ?? "").trim().length > 0 && (image.storagePath ?? "").trim().length > 0,
  ).length;
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
      
      // Ana görsel sıkıştırma (WebP çıkışı olsa iyi olurdu ama kütüphane desteğine göre)
      compressibleFile = await imageCompression(file, { 
        maxSizeMB: 0.8, 
        maxWidthOrHeight: 1600, 
        useWebWorker: true,
        fileType: "image/jpeg" // Force jpeg for performance/compatibility or let it be
      });

      // Blur placeholder üretimi (Çok küçük boyut)
      const blurFile = await imageCompression(file, {
        maxSizeMB: 0.005, // 5KB altı
        maxWidthOrHeight: 20,
        useWebWorker: true,
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
      if (previousImage?.storagePath) await removeUploadedImage(previousImage.storagePath);
      revokeBlobUrl(previewUrl);
      
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
      updateUploadState(fieldId, { message, progress: 0, status: "error" });
    }
  };

  const handleRemoveImage = (index: number) => {
    const fieldId = fields[index].id;
    const currentImage = getValues(`images.${index}`);
    if (currentImage?.storagePath) removeUploadedImage(currentImage.storagePath);
    revokeBlobUrl(uploadStates[fieldId]?.previewUrl);
    
    const nextStates = { ...uploadStates };
    delete nextStates[fieldId];
    setUploadStates(nextStates);
    
    // We don't remove the field index to keep the grid stable, we just clear the value
    setValue(`images.${index}`, { fileName: "", storagePath: "", url: "" }, { shouldDirty: true });
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
        posthog?.capture("listing_submit_failed", {
          isEditing,
          responseStatus: response.status,
          message: payload?.error?.message ?? "Bir hata oluştu.",
          listingId: initialListing?.id,
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
      posthog?.capture(isEditing ? "listing_update_succeeded" : "listing_submit_succeeded", {
        listingId: payload?.data?.listing?.id ?? initialListing?.id,
        listingStatus: payload?.data?.listing?.status,
      });

      if (isEditing) {
        router.replace("/dashboard/listings?updated=true");
        return;
      }

      router.push("/dashboard/listings?created=pending");
    } catch {
      posthog?.capture("listing_submit_failed", {
        isEditing,
        listingId: initialListing?.id,
        message: "Bağlantı hatası.",
      });
      setSubmitState({ message: "Bağlantı hatası.", status: "error" });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isEmailVerifiedLocally) {
      setIsVerifyDialogOpen(true);
      return;
    }

    await submitListing(values);
  });

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 w-full flex-1">
      <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Yeni İlan Oluştur</h1>
        <p className="text-gray-500 mt-2">Aracınızı milyonlarca alıcıyla buluşturmak için formu doldurmaya başlayın.</p>
      </div>

      <StepIndicator currentStep={currentStep} />

      <form onSubmit={onSubmit} className="space-y-10">
        {submitState.status === "success" && submitState.message && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300 shadow-sm">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-800">{submitState.message}</p>
          </div>
        )}

        {submitState.status === "error" && submitState.message && (
          <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300 shadow-sm">
            <AlertCircle className="size-5 text-red-500" />
            <p className="text-sm font-semibold text-red-800">{submitState.message}</p>
          </div>
        )}

        {errors.root && (
          <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 shadow-sm">
            <AlertCircle className="size-5 text-red-500" />
            <p className="text-sm font-semibold text-red-800">{errors.root.message}</p>
          </div>
        )}

        <div className="min-h-[500px]">
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

        {/* Navigation Controls */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-100">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="bg-white border border-gray-300 text-gray-700 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              Geri
            </button>
          )}

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-blue-500 text-white font-bold px-10 py-3 rounded-xl hover:bg-blue-600 transition shadow-md flex items-center group"
            >
              İleri 
              <ChevronRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAnyImage || uploadedImageCount < minimumListingImages}
              className="bg-blue-500 text-white font-bold px-10 py-3 rounded-xl hover:bg-blue-600 transition shadow-md flex items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin mr-2" />
                  Yayınlanıyor...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} className="mr-2" />
                  {isEditing ? "İlanı Güncelle" : "İlanı Moderasyona Gönder"}
                </>
              )}
            </button>
          )}
        </div>
      </form>

      <PhoneVerificationDialog
        isOpen={isVerifyDialogOpen}
        onOpenChange={setIsVerifyDialogOpen}
        onSuccess={() => {
          setIsEmailVerifiedLocally(true);
          setIsVerifyDialogOpen(false);
          form.handleSubmit(submitListing)();
        }}
      />
    </div>
  );
}
