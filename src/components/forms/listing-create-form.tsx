"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  ImagePlus,
  Info,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  AlertCircle,
  Car,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import type { z } from "zod";

import {
  fuelTypes,
  listingImageAcceptedMimeTypes,
  maximumCarYear,
  minimumCarYear,
  minimumListingImages,
  transmissionTypes,
} from "@/lib/constants/domain";
import { cn, formatNumber } from "@/lib/utils";
import { listingCreateFormSchema } from "@/lib/validators";
import {
  formatFileSize,
  getListingImageConstraintsText,
  validateListingImageFile,
} from "@/services/listings/listing-images";
import { lookupVehicleByPlate } from "@/services/listings/plate-lookup";
import type { BrandCatalogItem, CityOption, Listing, ListingCreateFormValues } from "@/types";
import { DamageSelector } from "./damage-selector";
import { ExpertInspectionEditor } from "./expert-inspection-editor";

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

function FormSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: typeof ShieldCheck;
  title: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
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

const inputClassName =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary";

const initialSubmitState: SubmitState = {
  status: "idle",
};

type ListingCreateFormSchemaInput = z.input<typeof listingCreateFormSchema>;
type ListingCreateFormSchemaOutput = z.output<typeof listingCreateFormSchema>;

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
  const form = useForm<
    ListingCreateFormSchemaInput,
    undefined,
    ListingCreateFormSchemaOutput
  >({
    defaultValues: buildDefaultValues(initialValues, initialListing),
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema),
  });

  const {
    control,
    clearErrors,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    trigger,
  } = form;

  const { append, fields, remove, move } = useFieldArray({
    control,
    name: "images",
  });

  const selectedBrand = useWatch({ control, name: "brand" });
  const selectedCity = useWatch({ control, name: "city" });
  const mileageValue = useWatch({ control, name: "mileage" });
  const imageValues = useWatch({ control, name: "images" }) ?? [];
  const uploadedImageCount = imageValues.filter(
    (image) => (image.url ?? "").trim().length > 0 && (image.storagePath ?? "").trim().length > 0,
  ).length;
  const plateValue = useWatch({ control, name: "licensePlate" });
  const isUploadingAnyImage = fields.some((field) => uploadStates[field.id]?.status === "uploading");
  const availableBrands = useMemo(() => {
    if (!initialListing?.brand) {
      return brands;
    }

    const existingBrand = brands.find((item) => item.brand === initialListing.brand);

    if (!existingBrand) {
      return [
        ...brands,
        {
          brand: initialListing.brand,
          models: initialListing.model ? [initialListing.model] : [],
        },
      ].sort((left, right) => left.brand.localeCompare(right.brand, "tr"));
    }

    if (!initialListing.model || existingBrand.models.includes(initialListing.model)) {
      return brands;
    }

    return brands.map((item) =>
      item.brand === initialListing.brand
        ? {
            ...item,
            models: [...item.models, initialListing.model].sort((left, right) =>
              left.localeCompare(right, "tr"),
            ),
          }
        : item,
    );
  }, [brands, initialListing]);
  const availableCities = useMemo(() => {
    if (!initialListing?.city) {
      return cities;
    }

    const existingCity = cities.find((item) => item.city === initialListing.city);

    if (!existingCity) {
      return [
        ...cities,
        {
          city: initialListing.city,
          cityPlate: null,
          districts: initialListing.district ? [initialListing.district] : [],
        },
      ].sort((left, right) => left.city.localeCompare(right.city, "tr"));
    }

    if (!initialListing.district || existingCity.districts.includes(initialListing.district)) {
      return cities;
    }

    return cities.map((item) =>
      item.city === initialListing.city
        ? {
            ...item,
            districts: [...item.districts, initialListing.district].sort((left, right) =>
              left.localeCompare(right, "tr"),
            ),
          }
        : item,
    );
  }, [cities, initialListing]);

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
        // Marka öncelikli çünkü modeller markaya bağlı
        setValue("brand", result.brand, { shouldDirty: true, shouldValidate: true });
        
        // Marka değişiminin yansıması için küçük bir bekleme gerekebilir 
        // veya react-hook-form'un state güncellenmesini beklemeliyiz.
        // Ama setValue senkrondur, altındaki model setleme çalışacaktır.
        setValue("model", result.model, { shouldDirty: true, shouldValidate: true });
        setValue("year", result.year, { shouldDirty: true, shouldValidate: true });
        
        // Yakıt ve Vites tiplerini eşleştir (string mapping gerekebilir)
        setValue("fuelType", result.fuelType as any, { shouldDirty: true, shouldValidate: true });
        setValue("transmission", result.transmission as any, { shouldDirty: true, shouldValidate: true });
        
        // Başlık da plaka verisinden oluşturulabilir (Opsiyonel)
        const brandLabel = availableBrands.find(b => b.brand === result.brand)?.brand || result.brand;
        setValue("title", `${result.year} ${brandLabel} ${result.model}`, { shouldDirty: true, shouldValidate: true });

        setSubmitState({
          status: "success",
          message: "Araç bilgileri başarıyla getirildi ve dolduruldu ✨",
        });
        setTimeout(() => setSubmitState(initialSubmitState), 3000);
      } else {
        setError("licensePlate", { message: "Bu plaka ile araç bilgisi bulunamadı." });
      }
    } catch (err) {
      console.error("Plate lookup error:", err);
      setError("licensePlate", { message: "Sorgulama sırasında bir hata oluştu." });
    } finally {
      setIsPlateLoading(false);
    }
  };

  const modelOptions =
    availableBrands.find((item) => item.brand === selectedBrand)?.models ?? [];
  const districtOptions =
    availableCities.find((item) => item.city === selectedCity)?.districts ?? [];

  useEffect(() => {
    const nextModelOptions =
      availableBrands.find((item) => item.brand === selectedBrand)?.models ?? [];
    const currentModel = getValues("model");

    if (currentModel && !nextModelOptions.includes(currentModel)) {
      setValue("model", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [availableBrands, getValues, selectedBrand, setValue]);

  useEffect(() => {
    const nextDistrictOptions =
      availableCities.find((item) => item.city === selectedCity)?.districts ?? [];
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

  const handleNextStep = async () => {
    let valid = true;
    if (currentStep === 0) {
      valid = await trigger(["title", "brand", "model", "year", "mileage", "fuelType", "transmission", "price"]);
    } else if (currentStep === 1) {
      valid = await trigger(["city", "district", "whatsappPhone", "description"]);
    } else if (currentStep === 2) {
      valid = await trigger(["expertInspection"]);
    }

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUploadState = (fieldId: string, nextState: UploadState) => {
    setUploadStates((current) => ({ ...current, [fieldId]: nextState }));
  };

  const removeUploadedImage = async (storagePath?: string) => {
    if (!storagePath) {
      return;
    }

    await fetch("/api/listings/images", {
      body: JSON.stringify({ storagePath }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    }).catch(() => undefined);
  };

  const handleImageUpload = async (index: number, fieldId: string, file?: File | null) => {
    if (!file) {
      return;
    }

    const fileError = await validateListingImageFile(file);

    if (fileError) {
      setError(`images.${index}.url` as FieldPath<ListingCreateFormSchemaInput>, {
        message: fileError,
        type: "validate",
      });
      updateUploadState(fieldId, {
        message: fileError,
        progress: 0,
        status: "error",
      });
      return;
    }

    const previousImage = getValues(`images.${index}`);

    updateUploadState(fieldId, {
      message: "Fotograf sikistiriliyor...",
      progress: 0,
      status: "uploading",
    });

    let compressibleFile = file;
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      compressibleFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch {
      // Fallback to original file
    }

    const previewUrl = URL.createObjectURL(compressibleFile);

    clearErrors([
      "images",
      `images.${index}.url` as FieldPath<ListingCreateFormSchemaInput>,
    ]);
    revokeBlobUrl(uploadStates[fieldId]?.previewUrl);
    updateUploadState(fieldId, {
      message: "Fotograf yukleniyor...",
      previewUrl,
      progress: 0,
      status: "uploading",
    });

    try {
      const payload = await uploadImageRequest(compressibleFile, (progress) => {
        updateUploadState(fieldId, {
          message: "Fotograf yukleniyor...",
          previewUrl,
          progress,
          status: "uploading",
        });
      });

      if (previousImage?.storagePath && previousImage.storagePath !== payload.image.storagePath) {
        await removeUploadedImage(previousImage.storagePath);
      }

      revokeBlobUrl(previewUrl);
      setValue(`images.${index}`, payload.image, {
        shouldDirty: true,
        shouldValidate: true,
      });
      clearErrors([
        "images",
        `images.${index}.url` as FieldPath<ListingCreateFormSchemaInput>,
      ]);
      updateUploadState(fieldId, {
        message: payload.message ?? "Fotograf yuklendi.",
        previewUrl: payload.image.url,
        progress: 100,
        status: "uploaded",
      });
    } catch (error) {
      revokeBlobUrl(previewUrl);
      updateUploadState(fieldId, {
        message: error instanceof Error ? error.message : "Fotograf yuklenemedi.",
        previewUrl: previousImage?.url,
        progress: 0,
        status: "error",
      });
      setError(`images.${index}.url` as FieldPath<ListingCreateFormSchemaInput>, {
        message: error instanceof Error ? error.message : "Fotograf yuklenemedi.",
        type: "server",
      });
    }
  };

  const handleRemoveImage = async (index: number, fieldId: string) => {
    if (fields.length <= minimumListingImages || uploadStates[fieldId]?.status === "uploading") {
      return;
    }

    const currentImage = getValues(`images.${index}`);
    revokeBlobUrl(uploadStates[fieldId]?.previewUrl);
    setUploadStates((current) => {
      const nextState = { ...current };
      delete nextState[fieldId];
      return nextState;
    });
    remove(index);
    await removeUploadedImage(currentImage?.storagePath);
  };

  const onSubmit = handleSubmit(async (values) => {
    clearErrors();
    setSubmitState(initialSubmitState);

    try {
      const response = await fetch(isEditing ? `/api/listings/${initialListing?.id ?? ""}` : "/api/listings", {
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
        method: isEditing ? "PATCH" : "POST",
      });

      const payload = await response.json().catch(() => null) as {
        success?: boolean;
        error?: { code: string; message: string; fieldErrors?: Record<string, string> };
        message?: string;
        data?: { message?: string; listing?: { id: string; slug: string } };
      } | null;

      if (!response.ok || !payload?.success) {
        const fieldErrors = payload?.error?.fieldErrors;
        const errorMessage = payload?.error?.message ?? "İlan oluşturulamadi. Lütfen alanlari kontrol et.";

        Object.entries(fieldErrors ?? {}).forEach(([path, message]) => {
          setError(path as FieldPath<ListingCreateFormSchemaInput>, {
            message,
            type: "server",
          });
        });

        setSubmitState({
          message: errorMessage,
          status: "error",
        });
        return;
      }

      Object.values(uploadStates).forEach((state) => {
        revokeBlobUrl(state.previewUrl);
      });
      setUploadStates({});
      reset(buildDefaultValues(initialValues, initialListing));
      setSubmitState({
        message: payload?.message ?? "İlanin kaydedildi.",
        status: "success",
      });
      if (isEditing) {
        router.replace("/dashboard/listings");
      }
      router.refresh();
    } catch {
      setSubmitState({
        message: "Bağlantı sırasında bir hata oluştu. Lütfen tekrar dene.",
        status: "error",
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Step Progress Indicator ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Adım {currentStep + 1}: {STEP_LABELS[currentStep]}
          </h2>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>
        <div className="flex gap-2">
          {STEP_LABELS.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                if (idx < currentStep) setCurrentStep(idx);
              }}
              className={`h-2 flex-1 rounded-full transition-colors ${
                idx <= currentStep ? "bg-primary" : "bg-muted"
              } ${idx < currentStep ? "cursor-pointer hover:bg-primary/80" : "cursor-default"}`}
              aria-label={`Adım ${idx + 1}: ${label}`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* ── Info Banner ── */}
        <section className="rounded-[1.75rem] border border-primary/15 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {isEditing ? "İlanını güncelliyorsun" : "İlanın önce moderasyona gider"}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Net başlık, doğru kilometre ve açıklayıcı fotoğraflar daha hızlı onay almanı
                sağlar. Yüklemelerde {getListingImageConstraintsText()} kuralı uygulanır.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            STEP 0 — Temel Araç Bilgileri
        ════════════════════════════════════════════════ */}
        {currentStep === 0 && (
          <>
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/70 bg-background p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Form modu
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {isEditing ? "İlan düzenleme" : "Yeni ilan oluşturma"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isEditing
                    ? "Sadece taslak veya incelemedeki ilanları güncelleyebilirsin."
                    : "Yeni ilan önce moderasyona gider, onay sonrası yayına açılır."}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  Fotoğraf hazırlığı
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {uploadedImageCount}/{Math.max(fields.length, minimumListingImages)} yüklendi
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  En az {minimumListingImages} fotoğraf ile güven sinyali artar, ilk fotoğraf kapak olur.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                  Hazır iletişim
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {initialValues.whatsappPhone || "Telefon bekleniyor"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Profildeki telefon form içine otomatik taşınır, alıcının ilk temas noktası burasıdır.
                </p>
              </div>
            </section>

            <FormSection
              icon={CarFront}
              title="Temel araç bilgileri"
              description="Marka, model, yıl ve fiyat bilgisini net tut — bu alanlar ilk filtreleme katmanıdır."
            >
              <div className="mb-8 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <label className="flex-1 space-y-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <span>Plaka ile Otomatik Doldur (Örn: 34ABC123)</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("licensePlate")}
                        placeholder="34 ABC 123"
                        className={`${inputClassName} uppercase placeholder:normal-case`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isPlateLoading ? (
                          <LoaderCircle className="size-4 animate-spin text-primary" />
                        ) : (
                          <Car className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={handlePlateLookup}
                    disabled={isPlateLoading || !plateValue}
                    className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isPlateLoading ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Wand2 className="size-4" />
                    )}
                    Bilgileri Getir
                  </button>
                </div>
                {errors.licensePlate ? (
                  <p className="mt-2 text-sm text-destructive">{errors.licensePlate.message}</p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Plaka girerek marka, model, yıl ve paket bilgilerini saniyeler içinde doldurabilirsin.
                  </p>
                )}
              </div>

              <section className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                  <span>İlan başlığı</span>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Örn. 2020 Renault Clio 1.0 TCe Touch"
                    className={inputClassName}
                  />
                  {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Marka</span>
                  <select {...register("brand")} className={inputClassName}>
                    <option value="">Marka seç</option>
                    {availableBrands.map((item) => (
                      <option key={item.brand} value={item.brand}>
                        {item.brand}
                      </option>
                    ))}
                  </select>
                  {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Model</span>
                  <select
                    {...register("model")}
                    disabled={modelOptions.length === 0}
                    className={inputClassName}
                  >
                    <option value="">{selectedBrand ? "Model seç" : "Önce marka seç"}</option>
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Yıl</span>
                  <input
                    type="number"
                    min={minimumCarYear}
                    max={maximumCarYear}
                    inputMode="numeric"
                    {...register("year", { valueAsNumber: true })}
                    className={inputClassName}
                  />
                  {errors.year ? <p className="text-sm text-destructive">{errors.year.message}</p> : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Kilometre</span>
                  <input
                    type="number"
                    min={0}
                    max={1_000_000}
                    inputMode="numeric"
                    {...register("mileage", { valueAsNumber: true })}
                    className={inputClassName}
                  />
                  {errors.mileage ? (
                    <p className="text-sm text-destructive">{errors.mileage.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Mevcut değer: {formatNumber(Number(mileageValue || 0))} km
                    </p>
                  )}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Yakıt tipi</span>
                  <select {...register("fuelType")} className={inputClassName}>
                    {fuelTypes.map((fuelType) => (
                      <option key={fuelType} value={fuelType}>
                        {fuelType}
                      </option>
                    ))}
                  </select>
                  {errors.fuelType ? (
                    <p className="text-sm text-destructive">{errors.fuelType.message}</p>
                  ) : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Vites</span>
                  <select {...register("transmission")} className={inputClassName}>
                    {transmissionTypes.map((transmission) => (
                      <option key={transmission} value={transmission}>
                        {transmission}
                      </option>
                    ))}
                  </select>
                  {errors.transmission ? (
                    <p className="text-sm text-destructive">{errors.transmission.message}</p>
                  ) : null}
                </label>

                <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                  <span>Fiyat</span>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="Örn. 925000"
                    className={inputClassName}
                  />
                  {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
                </label>
              </section>
            </FormSection>
          </>
        )}

        {/* ════════════════════════════════════════════════
            STEP 1 — Konum, İletişim, Açıklama
        ════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <>
            <FormSection
              icon={MapPin}
              title="Konum ve iletişim"
              description="Şehir, ilçe ve WhatsApp verisini doğru girmek güven sinyalini artırır."
            >
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Şehir</span>
                    <select {...register("city")} className={inputClassName}>
                      <option value="">Şehir seç</option>
                      {availableCities.map((item) => (
                        <option key={item.city} value={item.city}>
                          {item.city}
                        </option>
                      ))}
                    </select>
                    {errors.city ? <p className="text-sm text-destructive">{errors.city.message}</p> : null}
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>İlçe</span>
                    <select
                      {...register("district")}
                      disabled={districtOptions.length === 0}
                      className={inputClassName}
                    >
                      <option value="">{selectedCity ? "İlçe seç" : "Önce şehir seç"}</option>
                      {districtOptions.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    {errors.district ? (
                      <p className="text-sm text-destructive">{errors.district.message}</p>
                    ) : null}
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>WhatsApp telefonu</span>
                    <input
                      type="tel"
                      {...register("whatsappPhone")}
                      placeholder="+90 5xx xxx xx xx"
                      className={inputClassName}
                    />
                    {errors.whatsappPhone ? (
                      <p className="text-sm text-destructive">{errors.whatsappPhone.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Alıcıların ilk temas noktası bu numara olacak.
                      </p>
                    )}
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    <span>Açıklama</span>
                    <textarea
                      rows={6}
                      {...register("description")}
                      placeholder="Bakım geçmişi, boya/değişen durumu ve öne çıkan özellikleri kısaca anlat."
                      className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                    />
                    {errors.description ? (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        En az 20 karakter ile güven veren net bir açıklama yaz.
                      </p>
                    )}
                  </label>
                </div>

                <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <MessageCircle className="size-4" />
                    Alıcı ilk neyi görecek?
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Şehir, ilçe ve WhatsApp alanları ilan kartı ve detay ekranında güven sinyali olarak
                    kullanılır. Açıklamada boya, değişen, bakım ve ekspertiz bilgisi varsa onay daha
                    hızlı ilerler.
                  </p>
                  <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-background/90 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Varsayılan şehir
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {selectedCity || initialValues.city || "Henüz seçilmedi"}
                    </p>
                  </div>
                </div>
              </section>
            </FormSection>

            <FormSection
              icon={AlertCircle}
              title="Boya ve değişen durumu"
              description="Her bir parçanın durumunu seç — seçmediğin parçalar 'Orijinal' sayılacaktır."
            >
              <Controller
                name="damageStatusJson"
                control={control}
                render={({ field }) => (
                  <DamageSelector
                    value={(field.value as Record<string, string>) || {}}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormSection>

            <FormSection
              icon={FileText}
              title="Tramer kaydı"
              description="Şeffaflık güven yaratır. Doğru Tramer bilgisi girmek aracınızın daha hızlı satılmasını sağlar."
            >
              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-medium text-foreground">
                  <span>Tramer Kaydı Toplamı (TL)</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      {...register("tramerAmount", { valueAsNumber: true })}
                      placeholder="0 veya miktar giriniz."
                      className={cn(inputClassName, "pl-12")}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      ₺
                    </div>
                  </div>
                  {errors.tramerAmount ? (
                    <p className="text-sm text-destructive">{errors.tramerAmount.message}</p>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Tramer kaydı olmayan araçlar için 0 girin.
                      </p>
                      {(getValues("tramerAmount") as number) > 0 && (
                        <p className="text-xs font-bold text-indigo-600">
                          Girdiğiniz tutar: {formatNumber(getValues("tramerAmount") as number)} TL
                        </p>
                      )}
                    </div>
                  )}
                </label>

                <div className="flex flex-wrap gap-2">
                  {[0, 5000, 15000, 50000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setValue("tramerAmount", amount, { shouldDirty: true, shouldValidate: true })}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-xs font-bold transition-all",
                        getValues("tramerAmount") === amount
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-primary/50 hover:bg-slate-50"
                      )}
                    >
                      {amount === 0 ? "Hasarsız (0 ₺)" : `${formatNumber(amount)}+ ₺`}
                    </button>
                  ))}
                </div>
              </div>
            </FormSection>
          </>
        )}

        {/* ════════════════════════════════════════════════
            STEP 2 — Ekspertiz ve Kondisyon
        ════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <FormSection
            icon={ShieldCheck}
            title="Detaylı kondisyon ve ekspertiz"
            description="Motor, şanzıman ve mekanik aksamın durumunu belirt — bu bilgiler profesyonel alıcılar için kritiktir."
          >
            <ExpertInspectionEditor form={form as any} />
          </FormSection>
        )}

        {/* ════════════════════════════════════════════════
            STEP 3 — Fotoğraflar ve Gönderim
        ════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <>
            <FormSection
              icon={ImagePlus}
              title="Fotoğraf stüdyosu"
              description="Görseller alıcının güvenini belirler. Net, iyi ışıklı fotoğraflar yükle."
            >
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Fotoğraflar</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      En az {minimumListingImages} fotoğraf yükle. İlk fotoğraf kapak görseli olarak
                      kullanılır.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
                    <ImagePlus className="size-4 text-primary" />
                    {uploadedImageCount}/{Math.max(fields.length, minimumListingImages)} fotoğraf hazır
                  </div>
                </div>

                {typeof errors.images?.message === "string" ? (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {errors.images.message}
                  </p>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fields.map((field, index) => {
                    const imageValue = imageValues[index];
                    const uploadState = uploadStates[field.id];
                    const previewUrl = uploadState?.previewUrl ?? imageValue?.url;
                    const isUploading = uploadState?.status === "uploading";
                    const isUploaded =
                      uploadState?.status === "uploaded" ||
                      Boolean((imageValue?.url ?? "").trim() && (imageValue?.storagePath ?? "").trim());

                    return (
                      <div
                        key={field.id}
                        className={cn(
                          "group relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border-2 transition-all",
                          index === 0 
                            ? "border-primary shadow-lg shadow-primary/5 ring-4 ring-primary/5" 
                            : "border-border/60 bg-muted/30 hover:border-border"
                        )}
                      >
                        {/* ── Image/Preview ── */}
                        {previewUrl ? (
                          <>
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                              style={{ backgroundImage: `url(${previewUrl})` }}
                            />
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                              <div className="flex justify-end gap-2">
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => move(index, index - 1)}
                                    className="size-10 flex items-center justify-center rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-colors"
                                    title="Sola/Yukarı taşı"
                                  >
                                    <ChevronLeft className="size-4" />
                                  </button>
                                )}
                                {index < fields.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => move(index, index + 1)}
                                    className="size-10 flex items-center justify-center rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-colors"
                                    title="Sağa/Aşağı taşı"
                                  >
                                    <ChevronRight className="size-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void handleRemoveImage(index, field.id)}
                                  className="size-10 flex items-center justify-center rounded-xl bg-rose-500/90 text-white hover:bg-rose-500 transition-colors"
                                  title="Kaldır"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                              <label className="w-full">
                                <span className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/90 text-slate-900 text-xs font-bold hover:bg-white transition-colors">
                                  <Upload className="size-4" />
                                  Değiştir
                                </span>
                                <input
                                  type="file"
                                  accept={listingImageAcceptedMimeTypes.join(",")}
                                  className="sr-only"
                                  onChange={(event) => {
                                    void handleImageUpload(index, field.id, event.target.files?.[0] ?? null);
                                    event.currentTarget.value = "";
                                  }}
                                />
                              </label>
                            </div>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 p-4 text-center">
                            <div className="size-12 flex items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                              <ImagePlus className="size-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-foreground">Fotoğraf Ekle</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                {index === 0 ? "Kapak Fotoğrafı" : `Fotoğraf ${index + 1}`}
                              </p>
                            </div>
                            <input
                              type="file"
                              accept={listingImageAcceptedMimeTypes.join(",")}
                              className="sr-only"
                              onChange={(event) => {
                                void handleImageUpload(index, field.id, event.target.files?.[0] ?? null);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        )}

                        {/* ── Status Badges ── */}
                        <div className="absolute left-3 top-3 flex flex-col gap-2 pointer-events-none">
                          {index === 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                              <Sparkles className="size-3" />
                              Kapak
                            </span>
                          )}
                          {isUploading && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold text-primary shadow-lg backdrop-blur-sm">
                              <LoaderCircle className="size-3 animate-spin" />
                              {uploadState?.progress}%
                            </span>
                          )}
                          {isUploaded && !isUploading && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                              <CheckCircle2 className="size-3" />
                              Hazır
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* ── Add More Slot ── */}
                  {fields.length < 20 && (
                    <button
                      type="button"
                      onClick={() => append({})}
                      className="group flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-[1.5rem] border-2 border-dashed border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <div className="size-12 flex items-center justify-center rounded-2xl border-2 border-dashed border-border group-hover:border-primary transition-all">
                        <Plus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">Yeni Slot Ekle</span>
                    </button>
                  )}
                </div>
              </section>
            </FormSection>

            {submitState.status === "error" ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {submitState.message}
              </p>
            ) : null}

            {submitState.status === "success" ? (
              <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                {submitState.message}
              </p>
            ) : null}
          </>
        )}


        {/* ── Navigation Buttons ── */}
        <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
                Önceki adım
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {isEditing && currentStep === 3 ? (
              <button
                type="button"
                onClick={() => router.replace("/dashboard/listings")}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Düzenlemeyi iptal et
              </button>
            ) : null}

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={() => void handleNextStep()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Sonraki adım
                <ChevronRight className="size-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || isUploadingAnyImage}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting || isUploadingAnyImage ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {isSubmitting
                  ? isEditing
                    ? "İlan güncelleniyor..."
                    : "İlan gönderiliyor..."
                  : isUploadingAnyImage
                    ? "Fotoğraflar yükleniyor..."
                    : isEditing
                      ? "Değişiklikleri kaydet"
                      : "İlanı moderasyona gönder"}
              </button>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
