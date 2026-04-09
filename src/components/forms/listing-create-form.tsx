"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CarFront,
  CheckCircle2,
  FileText,
  ImagePlus,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import type { z } from "zod";

import { brandCatalog, cityOptions } from "@/data";
import {
  fuelTypes,
  listingImageAcceptedMimeTypes,
  maximumCarYear,
  minimumCarYear,
  minimumListingImages,
  transmissionTypes,
} from "@/lib/constants/domain";
import { formatNumber } from "@/lib/utils";
import { listingCreateFormSchema } from "@/lib/validators";
import {
  formatFileSize,
  getListingImageConstraintsText,
  validateListingImageFile,
} from "@/services/listings/listing-images";
import type { ExpertInspection, Listing, ListingCreateFormValues } from "@/types";

interface ListingCreateFormProps {
  initialValues: {
    city: string;
    whatsappPhone: string;
  };
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
    images:
      sortedImages.length > 0
        ? sortedImages.map((image) => ({
            fileName: image.storagePath.split("/").pop(),
            storagePath: image.storagePath,
            url: image.url,
          }))
        : Array.from({ length: minimumListingImages }, () => ({})),
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

export function ListingCreateForm({ initialListing, initialValues }: ListingCreateFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialListing);
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const uploadStatesRef = useRef<Record<string, UploadState>>({});
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
  } = useForm<
    ListingCreateFormSchemaInput,
    undefined,
    ListingCreateFormSchemaOutput
  >({
    defaultValues: buildDefaultValues(initialValues, initialListing),
    mode: "onBlur",
    resolver: zodResolver(listingCreateFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
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
  const isUploadingAnyImage = fields.some((field) => uploadStates[field.id]?.status === "uploading");
  const modelOptions = brandCatalog.find((item) => item.brand === selectedBrand)?.models ?? [];
  const districtOptions = cityOptions.find((item) => item.city === selectedCity)?.districts ?? [];
  const [expertDocUploading, setExpertDocUploading] = useState(false);
  const [expertDocError, setExpertDocError] = useState<string | null>(null);
  const watchedExpertInspection = useWatch({ control, name: "expertInspection" });
  const watchedExpertDocUrl = (watchedExpertInspection as ExpertInspection | undefined)?.documentUrl;

  useEffect(() => {
    const nextModelOptions = brandCatalog.find((item) => item.brand === selectedBrand)?.models ?? [];
    const currentModel = getValues("model");

    if (currentModel && !nextModelOptions.includes(currentModel)) {
      setValue("model", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [getValues, selectedBrand, setValue]);

  useEffect(() => {
    const nextDistrictOptions =
      cityOptions.find((item) => item.city === selectedCity)?.districts ?? [];
    const currentDistrict = getValues("district");

    if (currentDistrict && !nextDistrictOptions.includes(currentDistrict)) {
      setValue("district", "", { shouldDirty: true, shouldValidate: true });
    }
  }, [getValues, selectedCity, setValue]);

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
    const previewUrl = URL.createObjectURL(file);

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
      const payload = await uploadImageRequest(file, (progress) => {
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
      reset(buildDefaultValues(initialValues));
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
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-[1.75rem] border border-primary/15 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {isEditing ? "Ilanini guncelliyorsun" : "Ilanin once moderasyona gider"}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Net baslik, dogru kilometre ve aciklayici fotograflar daha hizli onay almani
              saglar. Yuklemelerde {getListingImageConstraintsText()} kurali uygulanir.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.5rem] border border-border/70 bg-background p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Form modu
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            {isEditing ? "Ilan duzenleme" : "Yeni ilan olusturma"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isEditing
              ? "Sadece taslak veya incelemedeki ilanlari guncelleyebilirsin."
              : "Yeni ilan once moderasyona gider, onay sonrasi yayina acilir."}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Fotograf hazirligi
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            {uploadedImageCount}/{Math.max(fields.length, minimumListingImages)} yuklendi
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            En az {minimumListingImages} fotograf ile guven sinyali artar, ilk fotograf kapak olur.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
            Hazir iletisim
          </p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
            {initialValues.whatsappPhone || "Telefon bekleniyor"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Profildeki telefon form icine otomatik tasinir, alicinin ilk temas noktasi burasidir.
          </p>
        </div>
      </section>

      <FormSection
        icon={CarFront}
        title="Temel arac bilgileri"
        description="AI Studio sahnesindeki ilk karar katmani gibi, marka, model, yil ve fiyat bilgisini net tut."
      >
        <section className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
          <span>Ilan basligi</span>
          <input
            type="text"
            {...register("title")}
            placeholder="Orn. 2020 Renault Clio 1.0 TCe Touch"
            className={inputClassName}
          />
          {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Marka</span>
          <select {...register("brand")} className={inputClassName}>
            <option value="">Marka sec</option>
            {brandCatalog.map((item) => (
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
            <option value="">{selectedBrand ? "Model sec" : "Once marka sec"}</option>
            {modelOptions.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Yil</span>
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
              Mevcut deger: {formatNumber(Number(mileageValue || 0))} km
            </p>
          )}
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Yakit tipi</span>
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
            placeholder="Orn. 925000"
            className={inputClassName}
          />
          {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
        </label>
        </section>
      </FormSection>

      <FormSection
        icon={MapPin}
        title="Konum ve iletisim"
        description="Figma component mantigiyla gruplanmis bu alan, konum ve WhatsApp verisini daha duzenli gosterir."
      >
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Sehir</span>
          <select {...register("city")} className={inputClassName}>
            <option value="">Sehir sec</option>
            {cityOptions.map((item) => (
              <option key={item.city} value={item.city}>
                {item.city}
              </option>
            ))}
          </select>
          {errors.city ? <p className="text-sm text-destructive">{errors.city.message}</p> : null}
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground">
          <span>Ilce</span>
          <select
            {...register("district")}
            disabled={districtOptions.length === 0}
            className={inputClassName}
          >
            <option value="">{selectedCity ? "Ilce sec" : "Once sehir sec"}</option>
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
              Alicilarin ilk temas noktasi bu numara olacak.
            </p>
          )}
        </label>

        <label className="block space-y-2 text-sm font-medium text-foreground sm:col-span-2">
          <span>Aciklama</span>
          <textarea
            rows={6}
            {...register("description")}
            placeholder="Bakim gecmisi, boya/degisen durumu ve one cikan ozellikleri kisaca anlat."
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          />
          {errors.description ? (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              En az 20 karakter ile guven veren net bir aciklama yaz.
            </p>
          )}
        </label>
          </div>

          <div className="rounded-[1.5rem] border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MessageCircle className="size-4" />
              Alici ilk neyi gorecek?
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sehir, ilce ve WhatsApp alanlari ilan karti ve detay ekraninda guven sinyali olarak
              kullanilir. Aciklamada boya, degisen, bakim ve ekspertiz bilgisi varsa onay daha
              hizli ilerler.
            </p>
            <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-background/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Varsayilan sehir
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {selectedCity || initialValues.city || "Henuz secilmedi"}
              </p>
            </div>
          </div>
        </section>
      </FormSection>

      <FormSection
        icon={ImagePlus}
        title="Fotograf studyosu"
        description="AI Studio’daki spotlight kartlar gibi, gorselleri belirgin ve yonlendirici bir alanda topluyoruz."
      >
        <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Fotograflar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              En az {minimumListingImages} fotograf yukle. Ilk fotograf kapak gorseli olarak
              kullanilir.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
            <ImagePlus className="size-4 text-primary" />
            {uploadedImageCount}/{Math.max(fields.length, minimumListingImages)} fotograf hazir
          </div>
        </div>

        {typeof errors.images?.message === "string" ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errors.images.message}
          </p>
        ) : null}

        <div className="grid gap-4">
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
                className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4 lg:grid-cols-[220px_minmax(0,1fr)]"
              >
                <div className="overflow-hidden rounded-[1.25rem] border border-dashed border-border bg-muted/50">
                  {previewUrl ? (
                    <div
                      className="aspect-[4/3] bg-cover bg-center"
                      style={{ backgroundImage: `url(${previewUrl})` }}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
                      <ImagePlus className="size-5 text-primary" />
                      <span>Bir fotograf sectiginde onizleme burada gorunur.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      Fotograf {index + 1} {index === 0 ? "(Kapak)" : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleRemoveImage(index, field.id)}
                      disabled={fields.length <= minimumListingImages || isUploading}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="size-4" />
                      Kaldir
                    </button>
                  </div>

                  <label className="block space-y-2 text-sm font-medium text-foreground">
                    <span>Fotograf sec</span>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                        <Upload className="size-4" />
                        Dosya sec ve yukle
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

                      {isUploaded ? (
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                          <CheckCircle2 className="size-4" />
                          Yukleme hazir
                        </span>
                      ) : null}
                    </div>

                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${uploadState?.progress ?? 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Yukleme ilerlemesi: %{uploadState?.progress ?? 0}
                        </p>
                      </div>
                    ) : null}

                    {errors.images?.[index]?.url ? (
                      <p className="text-sm text-destructive">
                        {errors.images[index]?.url?.message}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {getListingImageConstraintsText()} desteklenir.
                      </p>
                    )}
                  </label>

                  {imageValue?.fileName ? (
                    <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">{imageValue.fileName}</p>
                      <p className="mt-1">
                        {imageValue.mimeType ?? "image"} ·{" "}
                        {typeof imageValue.size === "number" ? formatFileSize(imageValue.size) : "-"}
                      </p>
                    </div>
                  ) : null}

                  {uploadState?.message ? (
                    <p
                      className={
                        uploadState.status === "error"
                          ? "text-sm text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {uploadState.message}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => append({})}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-4" />
          Yeni fotograf alani ekle
        </button>
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

      <section className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Son kontrol ve gonderim
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Fotograflar ve temel alanlar hazirsa ilani kaydet. Sistem gerekli dogrulamalari bu
              adimda tekrar calistirir.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting || isUploadingAnyImage}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting || isUploadingAnyImage ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isSubmitting
              ? isEditing
                ? "Ilan guncelleniyor..."
                : "Ilan gonderiliyor..."
              : isUploadingAnyImage
                ? "Fotograflar yukleniyor..."
                : isEditing
                  ? "Degisiklikleri kaydet"
                  : "Ilani moderasyona gonder"}
          </button>

          {isEditing ? (
            <button
              type="button"
              onClick={() => router.replace("/dashboard/listings")}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              Duzenlemeyi iptal et
            </button>
          ) : null}
        </div>
      </section>
    </form>
  );
}
