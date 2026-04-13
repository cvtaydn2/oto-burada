"use client";

import { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { ImagePlus, Upload, Trash2, CheckCircle2, LoaderCircle, Sparkles, Wand2, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ListingCreateFormValues } from "@/types";
import { useState } from "react";

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
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCleaningIndices(prev => prev.filter(i => i !== index));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40 text-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex items-start gap-4 mb-8">
          <div className="size-14 rounded-2xl bg-slate-950 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-900/20 italic font-black text-xl">
            <ImagePlus size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Görsel Vitrini</h3>
            <p className="text-sm text-slate-500 font-medium">Platformun en hızlı ilanları, doğru açılarla çekilmiş yüksek kaliteli fotoğraflarla başlar.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          {fields.map((field, index) => {
            const uploadState = uploadStates[field.id];
            const hasUrl = watchImages[index]?.url;
            const guideText = PHOTO_GUIDES[index] || "Diğer Fotoğraf";

            return (
              <div
                key={field.id}
                className={cn(
                  "relative group aspect-[4/3] rounded-[2rem] border-2 border-dashed border-slate-200 transition-all duration-500 overflow-hidden bg-slate-50/50 hover:border-primary/50",
                  hasUrl && "border-solid border-slate-100 shadow-xl scale-100 active:scale-95",
                  uploadState?.status === "error" && "border-rose-200 bg-rose-50"
                )}
              >
                {hasUrl ? (
                  <>
                    <Image
                      src={watchImages[index].url!}
                      alt={`Fotoğraf ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px] flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleCleanBackground(index)}
                        disabled={cleaningIndices.includes(index)}
                        className="size-11 bg-white rounded-2xl text-slate-900 shadow-2xl hover:bg-slate-900 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
                        title="Arka Planı Temizle (AI Optimizasyonu)"
                      >
                        {cleaningIndices.includes(index) ? (
                          <LoaderCircle size={20} className="animate-spin" />
                        ) : (
                          <Wand2 size={20} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveImage(index)}
                        className="size-11 bg-white rounded-2xl text-rose-500 shadow-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                        title="Kaldır"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {cleaningIndices.includes(index) && (
                      <div className="absolute inset-0 bg-primary/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
                         <div className="relative">
                            <Sparkles className="size-8 animate-pulse mb-2 text-white" />
                            <div className="absolute inset-0 blur-xl bg-white/50 animate-pulse" />
                         </div>
                         <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-center leading-tight">AI Arka Planı <br />Optimize Ediyor</span>
                      </div>
                    )}

                    {index === 0 && (
                      <div className="absolute top-3 left-3 bg-slate-950 text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-xl italic tracking-widest flex items-center gap-2">
                        <Star className="size-3 fill-primary text-primary" />
                        KAPAK
                      </div>
                    )}
                    
                    <div className="absolute bottom-3 right-3 glass-dark text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm flex items-center gap-1.5 opacity-90 backdrop-blur-xl">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      HAZIR
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-3 hover:bg-white transition-all group-hover:shadow-inner">
                    {uploadState?.status === "uploading" ? (
                      <div className="flex flex-col items-center gap-3">
                         <div className="relative size-12 flex items-center justify-center">
                            <LoaderCircle className="size-full text-primary animate-spin" strokeWidth={3} />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary">
                              {uploadState.progress}%
                            </span>
                         </div>
                         <span className="text-[9px] font-black uppercase tracking-[0.15em] text-primary italic">Yükleniyor</span>
                      </div>
                    ) : (
                      <>
                        <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                           <Upload size={24} />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors italic">{guideText}</span>
                           <span className="text-[9px] font-bold text-slate-300 uppercase leading-none">Dokun veya Sürükle</span>
                        </div>
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
                  <div className="absolute inset-x-0 bottom-0 bg-rose-500 text-white text-[9px] py-1.5 px-2 text-center font-black uppercase tracking-widest italic animate-in slide-in-from-bottom-2">
                    YÜKLEME HATASI!
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-start gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative z-10">
            <CheckCircle2 size={20} />
          </div>
          <div className="relative z-10">
             <p className="text-sm text-slate-900 leading-relaxed font-bold italic antialiased mb-1">
               Profesyonel Fotoğraf Kılavuzu
             </p>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
               Güneşi arkana al, kamerayı yatay tut. Aracın tüm açılarını gösteren ilanlar <span className="text-primary font-bold">3 kat daha hızlı</span> satılıyor.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
