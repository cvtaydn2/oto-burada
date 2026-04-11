"use client";

import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { ImagePlus, Upload, Trash2, CheckCircle2, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { minimumListingImages } from "@/lib/constants/domain";
import { ListingCreateFormValues } from "@/types";

interface PhotosStepProps {
  form: UseFormReturn<ListingCreateFormValues>;
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm sm:p-6 text-slate-900">
        <div className="flex items-start gap-4 mb-6">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ImagePlus size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Fotoğraflar</h3>
            <p className="text-sm text-muted-foreground">Aracınızın farklı açılardan en az {minimumListingImages} fotoğrafını yükleyin.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {fields.map((field, index) => {
            const uploadState = uploadStates[field.id];
            const hasUrl = watchImages[index]?.url;

            return (
              <div
                key={field.id}
                className={cn(
                  "relative aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 transition-all overflow-hidden bg-slate-50",
                  hasUrl && "border-solid border-indigo-200 shadow-sm",
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
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="p-2 bg-white rounded-full text-red-500 shadow-lg hover:scale-110 transition-transform"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md">
                        KAPAK
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <CheckCircle2 size={10} />
                      HAZIR
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                    {uploadState?.status === "uploading" ? (
                      <>
                        <LoaderCircle className="size-6 text-primary animate-spin" />
                        <span className="text-[10px] font-bold text-primary">{uploadState.progress}%</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Fotoğraf Ekle</span>
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

                {/* Status Overlays */}
                {uploadState?.status === "error" && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-500 text-white text-[9px] py-1 px-2 text-center font-bold">
                    HATA!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
          <CheckCircle2 className="size-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-900 leading-relaxed font-medium">
            <strong>İpucu:</strong> Aydınlık bir ortamda, aracın ön, arka ve yan profillerinden çekilen fotoğraflar alıcıların güvenini artırır.
          </p>
        </div>
      </div>
    </div>
  );
}
