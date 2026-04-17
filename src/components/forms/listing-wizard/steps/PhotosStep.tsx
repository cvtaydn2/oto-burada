"use client";

import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Upload, Trash2, LoaderCircle, Star, Info, Rotate3d } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ListingCreateFormValues } from "@/types";
import { FormSection } from "@/components/shared/design-system/FormSection";

interface PhotosStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  fieldArray: UseFieldArrayReturn<ListingCreateFormValues, "images", "id">;
  uploadStates: Record<string, { status: string; progress: number; message?: string; previewUrl?: string }>;
  onImageChange: (index: number, file: File | null) => void;
  onRemoveImage: (index: number) => void;
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
                  uploadState?.status === "error" && "border-red-200 bg-red-50",
                )}
              >
                {hasUrl ? (
                  <>
                    <Image
                      src={imageVal.url!}
                      alt={`Fotoğraf ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* Hover overlay — delete + 360° toggle */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle360(index)}
                        title={is360 ? "Normal fotoğrafa dönüştür" : "360° olarak işaretle"}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors",
                          is360
                            ? "bg-blue-500 text-white"
                            : "bg-white/90 text-gray-700 hover:bg-blue-500 hover:text-white",
                        )}
                      >
                        <Rotate3d size={13} />
                        {is360 ? "360° Aktif" : "360° Ekle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

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
                  <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-2">
                    {uploadState?.status === "uploading" ? (
                      <div className="flex flex-col items-center gap-2">
                        <LoaderCircle className="size-6 text-blue-500 animate-spin" />
                        <span className="text-[10px] font-bold text-blue-500">
                          {uploadState.progress}%
                        </span>
                      </div>
                    ) : uploadState?.status === "error" ? (
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
                    {uploadState?.status !== "error" && (
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
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">Püf Noktası</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                Aracı temizleyin ve iyi aydınlatılmış bir alanda çekim yapın.
              </p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex gap-3">
            <Rotate3d className="size-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-indigo-800 mb-1">360° Panoramik Fotoğraf</p>
              <p className="text-xs text-indigo-600 leading-relaxed">
                Equirectangular (2:1 oran) panoramik fotoğraf yüklediyseniz, fotoğrafın üzerine
                gelip <strong>360° Ekle</strong> butonuna tıklayın. Alıcılar ilanı görüntülerken
                360° tur yapabilecek.
              </p>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
