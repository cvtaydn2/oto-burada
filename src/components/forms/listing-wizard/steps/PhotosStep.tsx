"use client";

import { Info, LoaderCircle, Rotate3d, Star, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";

import { FormSection } from "@/components/shared/design-system/FormSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {} from "@/lib";
import { cn } from "@/lib/utils";
import type { ListingCreateFormValues } from "@/types";

interface PhotosStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  fieldArray: UseFieldArrayReturn<ListingCreateFormValues, "images", "id">;
  uploadStates: Record<
    string,
    { status: string; progress: number; message?: string; previewUrl?: string }
  >;
  onImageChange: (index: number, file: File | null) => void;
  onRemoveImage: (index: number) => void;
  isDisabled?: boolean;
}

const PHOTO_GUIDES = [
  "Ön Çapraz (Sol)",
  "Ön Çapraz (Sağ)",
  "Arka Çapraz",
  "İç Mekan (Ön)",
  "Kadran / KM",
  "Motor Bölümü",
  "Bagaj",
  "Diğer Detay",
];

export function PhotosStep({
  form,
  fieldArray,
  uploadStates,
  onImageChange,
  onRemoveImage,
  isDisabled = false,
}: PhotosStepProps) {
  const { fields } = fieldArray;
  const { watch, setValue } = form;
  const watchImages = watch("images");

  const toggle360 = (index: number) => {
    const current = watchImages[index];
    const next = current?.imageType === "360" ? "photo" : "360";
    setValue(`images.${index}.imageType`, next, { shouldDirty: true });
  };

  return (
    <div className="space-y-10">
      <FormSection number={1} title="Medya ve Dosyalar">
        <p className="text-sm text-gray-500 mb-8">
          Aracınızın tüm açılarını gösteren en az 3 adet kaliteli fotoğraf yükleyin. Equirectangular
          (panoramik) fotoğrafları 360° olarak işaretleyebilirsiniz.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fields.map((field, index) => {
            const uploadState = uploadStates[field.id];
            const imageVal = watchImages[index];
            const hasUrl = imageVal?.url;
            const is360 = imageVal?.imageType === "360";
            const guideText = PHOTO_GUIDES[index] ?? "Diğer Fotoğraf";

            return (
              <div
                key={field.id}
                className={cn(
                  "relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden bg-gray-50",
                  hasUrl
                    ? is360
                      ? "border-solid border-blue-400 ring-2 ring-blue-200"
                      : "border-solid border-gray-100"
                    : "border-gray-200 hover:border-blue-300",
                  uploadState?.status === "error" && "border-red-200 bg-red-50"
                )}
              >
                {hasUrl ? (
                  <>
                    <Image
                      src={imageVal.url!}
                      alt={`Fotoğraf ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />

                    {/* Hover overlay — delete + 360° toggle */}
                    {!isDisabled && (
                      <div
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          onClick={() => toggle360(index)}
                          title={is360 ? "Normal fotoğrafa dönüştür" : "360° olarak işaretle"}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors",
                            is360
                              ? "bg-blue-500 text-white"
                              : "bg-white/90 text-gray-700 hover:bg-blue-500 hover:text-white"
                          )}
                        >
                          <Rotate3d size={13} />
                          {is360 ? "360° Aktif" : "360° Ekle"}
                        </Button>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveImage(index);
                          }}
                          className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}

                    {/* Cover badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 pointer-events-none">
                        <Star size={10} fill="currentColor" /> KAPAK
                      </div>
                    )}

                    {/* 360° badge */}
                    {is360 && (
                      <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 pointer-events-none">
                        <Rotate3d size={10} />
                        360°
                      </div>
                    )}
                  </>
                ) : (
                  <Label
                    className={cn(
                      "absolute inset-0 flex flex-col items-center justify-center gap-2",
                      !isDisabled && "cursor-pointer"
                    )}
                  >
                    {uploadState?.status === "uploading" ? (
                      <div className="flex flex-col items-center gap-2">
                        <LoaderCircle className="size-6 text-blue-500 animate-spin" />
                        <span className="text-[10px] font-bold text-blue-500">
                          {uploadState.progress}%
                        </span>
                      </div>
                    ) : uploadState?.status === "error" && !isDisabled ? (
                      // Hata durumu: retry butonu göster
                      <div className="flex flex-col items-center gap-2 px-2 text-center">
                        <span className="text-[10px] font-bold text-red-500 leading-tight">
                          {uploadState.message ?? "Yükleme hatası"}
                        </span>
                        <span className="text-[10px] font-bold text-red-400 underline">
                          Tekrar dene
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onImageChange(index, file);
                            // Input'u sıfırla — aynı dosya tekrar seçilebilsin
                            e.target.value = "";
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 text-center px-2 uppercase">
                          {guideText}
                        </span>
                      </>
                    )}
                    {uploadState?.status !== "error" && !isDisabled && (
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onImageChange(index, file);
                        }}
                      />
                    )}
                  </Label>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid gap-4">
          <div className="rounded-3xl bg-blue-50/50 border border-blue-100 p-6 animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-sm shadow-blue-500/30 flex-shrink-0">
                <Info size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900 tracking-tight">Profesyonel İpucu</p>
                <p className="text-xs text-blue-700/80 font-medium leading-relaxed mt-1">
                  Aracı temizleyin, plakayı gizleyin ve gün ışığında çekim yapın. Kaliteli
                  fotoğraflar ilanınızın %40 daha hızlı satılmasını sağlar.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-indigo-50/50 border border-indigo-100 p-6 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-start gap-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 flex-shrink-0">
                <Rotate3d size={20} strokeWidth={3} />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-900 tracking-tight">360° Deneyimi</p>
                <p className="text-xs text-indigo-700/80 font-medium leading-relaxed mt-1">
                  Equirectangular panoramik fotoğraf yüklediyseniz, üzerine gelip
                  <strong> 360° Ekle</strong> butonuna tıklayın. Alıcılar aracınızın içinde sanal
                  tur yapabilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
