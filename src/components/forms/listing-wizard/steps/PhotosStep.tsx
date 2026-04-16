"use client";

import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Upload, Trash2, LoaderCircle, Wand2, Star, Info } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ListingCreateFormValues } from "@/types";
import { useState } from "react";
import { FormSection } from "@/components/shared/design-system/FormSection";

interface PhotosStepProps {
  form: UseFormReturn<ListingCreateFormValues, unknown, ListingCreateFormValues>;
  fieldArray: UseFieldArrayReturn<ListingCreateFormValues, "images", "id">;
  uploadStates: Record<string, { status: string; progress: number; message?: string; previewUrl?: string }>;
  onImageChange: (index: number, file: File | null) => void;
  onRemoveImage: (index: number) => void;
}

export function PhotosStep({ 
  form, 
  fieldArray, 
  uploadStates, 
  onImageChange, 
  onRemoveImage 
}: PhotosStepProps) {
  const { fields } = fieldArray;
  const watchImages = form.watch("images");
  const [cleaningIndices, setCleaningIndices] = useState<number[]>([]);

  const PHOTO_GUIDES = [
    "Ön Çapraz (Sol)",
    "Ön Çapraz (Sağ)",
    "Arka Çapraz",
    "İç Mekan (Ön)",
    "Kadran / KM",
    "Motor Bölümü",
    "Bagaj",
    "Diğer Detay"
  ];

  const handleCleanBackground = async (index: number) => {
    if (cleaningIndices.includes(index)) return;
    setCleaningIndices(prev => [...prev, index]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setCleaningIndices(prev => prev.filter(i => i !== index));
  };

  return (
    <div className="space-y-10">
      <FormSection number={1} title="Medya ve Dosyalar">
        <p className="text-sm text-gray-500 mb-8">
          Aracınızın tüm açılarını gösteren en az 3 adet kaliteli fotoğraf yükleyin.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fields.map((field, index) => {
            const uploadState = uploadStates[field.id];
            const hasUrl = watchImages[index]?.url;
            const guideText = PHOTO_GUIDES[index] || "Diğer Fotoğraf";

            return (
              <div
                key={field.id}
                className={cn(
                  "relative aspect-[4/3] rounded-2xl border-2 border-dashed transition-all overflow-hidden bg-gray-50",
                  hasUrl ? "border-solid border-gray-100" : "border-gray-200 hover:border-blue-300",
                  uploadState?.status === "error" && "border-red-200 bg-red-50"
                )}
              >
                {hasUrl ? (
                  <>
                    <Image
                      src={watchImages[index].url!}
                      alt={`Fotoğraf ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCleanBackground(index)}
                        disabled={cleaningIndices.includes(index)}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        {cleaningIndices.includes(index) ? <LoaderCircle size={18} className="animate-spin" /> : <Wand2 size={18} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> KAPAK
                      </div>
                    )}
                  </>
                ) : (
                  <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-2">
                    {uploadState?.status === "uploading" ? (
                      <div className="flex flex-col items-center gap-2">
                        <LoaderCircle className="size-6 text-blue-500 animate-spin" />
                        <span className="text-[10px] font-bold text-blue-500">{uploadState.progress}%</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 text-center px-2 uppercase">{guideText}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onImageChange(index, file);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
          <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800 mb-1">Püf Noktası</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Aracı temizleyin ve iyi aydınlatılmış bir alanda çekim yapın. Arka plan temizleme (Wand ikonu) özelliğimizi kullanarak aracınızı öne çıkarabilirsiniz.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
