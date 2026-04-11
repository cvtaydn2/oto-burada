"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import type { z } from "zod";

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
    fileName: string;
    mimeType: string;
    size: number;
    storagePath: string;
    url: string;
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

export function ListingCreateForm({
  brands,
  cities,
  initialListing,
  initialValues,
}: ListingCreateFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialListing);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [isPlateLoading, setIsPlateLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = STEP_LABELS.length;
  const uploadStatesRef = useRef<Record<string, UploadState>>({});
  
  const form = useForm<ListingCreateFormValues>({
    defaultValues: buildDefaultValues(initialValues, initialListing),
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema as any),
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
      return [...brands, { brand: initialListing.brand, models: initialListing.model ? [initialListing.model] : [] }].sort((l, r) => l.brand.localeCompare(r.brand, "tr"));
    }
    if (!initialListing.model || existingBrand.models.includes(initialListing.model)) return brands;
    return brands.map((item) => item.brand === initialListing.brand ? { ...item, models: [...item.models, initialListing.model].sort((l, r) => l.localeCompare(r, "tr")) } : item);
  }, [brands, initialListing]);

  const availableCities = useMemo(() => {
    if (!initialListing?.city) return cities;
    const existingCity = cities.find((item) => item.city === initialListing.city);
    if (!existingCity) {
      return [...cities, { city: initialListing.city, cityPlate: null, districts: initialListing.district ? [initialListing.district] : [] }].sort((l, r) => l.city.localeCompare(r.city, "tr"));
    }
    if (!initialListing.district || existingCity.districts.includes(initialListing.district)) return cities;
    return cities.map((item) => item.city === initialListing.city ? { ...item, districts: [...item.districts, initialListing.district].sort((l, r) => l.localeCompare(r, "tr")) } : item);
  }, [cities, initialListing]);

  useEffect(() => {
    const nextModelOptions = availableBrands.find((item) => item.brand === selectedBrand)?.models ?? [];
    const currentModel = getValues("model");
    if (currentModel && !nextModelOptions.includes(currentModel)) {
      setValue("model", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [availableBrands, getValues, selectedBrand, setValue]);

  useEffect(() => {
    const nextDistrictOptions = availableCities.find((item) => item.city === selectedCity)?.districts ?? [];
    const currentDistrict = getValues("district");
    if (currentDistrict && !nextDistrictOptions.includes(currentDistrict)) {
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
    if (currentStep === 0) fieldsToValidate = ["brand", "model", "year", "mileage"];
    if (currentStep === 1) fieldsToValidate = ["city", "district", "title", "description", "price"];
    
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
    await fetch("/api/listings/images", {
      body: JSON.stringify({ storagePath }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE",
    }).catch(() => undefined);
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
    updateUploadState(fieldId, { message: "Fotoğraf yükleniyor...", progress: 0, status: "uploading" });
    
    let compressibleFile = file;
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      compressibleFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true });
    } catch {}

    const previewUrl = URL.createObjectURL(compressibleFile);
    clearErrors(`images.${index}.url` as FieldPath<ListingCreateFormValues>);
    updateUploadState(fieldId, { message: "Fotoğraf yükleniyor...", previewUrl, progress: 0, status: "uploading" });

    try {
      const payload = await uploadImageRequest(compressibleFile, (progress) => {
        updateUploadState(fieldId, { message: "Fotoğraf yükleniyor...", previewUrl, progress, status: "uploading" });
      });
      if (previousImage?.storagePath) await removeUploadedImage(previousImage.storagePath);
      revokeBlobUrl(previewUrl);
      setValue(`images.${index}`, payload.image, { shouldDirty: true, shouldValidate: true });
      updateUploadState(fieldId, { message: "Fotoğraf yüklendi.", previewUrl: payload.image.url, progress: 100, status: "uploaded" });
    } catch {
      revokeBlobUrl(previewUrl);
      updateUploadState(fieldId, { message: "Hata oluştu.", progress: 0, status: "error" });
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

  const onSubmit = handleSubmit(async (values) => {
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
        setSubmitState({ message: payload?.error?.message ?? "Bir hata oluştu.", status: "error" });
        return;
      }
      setSubmitState({ message: "İlan başarıyla kaydedildi.", status: "success" });
      if (isEditing) router.replace("/dashboard/listings");
      router.refresh();
    } catch {
      setSubmitState({ message: "Bağlantı hatası.", status: "error" });
    }
  });

  return (
    <div className="mx-auto max-w-4xl">
      <StepIndicator currentStep={currentStep} steps={STEP_LABELS} />

      <form onSubmit={onSubmit} className="space-y-6">
        {submitState.status === "success" && submitState.message && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-800">{submitState.message}</p>
          </div>
        )}

        {errors.root && (
          <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3">
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
        <div className="flex items-center justify-between pt-8 border-t border-slate-200">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 0 || isSubmitting}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Geri
          </button>

          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-bold text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-900/10"
            >
              Sonraki Adım
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAnyImage || uploadedImageCount < minimumListingImages}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Yayınlanıyor...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  {isEditing ? "İlanı Güncelle" : "İlanı Yayınla"}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
