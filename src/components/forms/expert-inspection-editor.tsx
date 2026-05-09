"use client";

import {
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  ShieldCheck,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ExpertInspectionGrade,
  expertInspectionGradeInfo,
  ExpertInspectionStatus,
  expertInspectionStatusLabels,
  ListingCreateFormValues,
} from "@/types";

interface ExpertInspectionEditorProps {
  form: UseFormReturn<ListingCreateFormValues>;
  isDisabled?: boolean;
}

const INSPECTION_FIELDS = [
  { name: "damageRecord", label: "Hasar Kaydı Sorgusu" },
  { name: "bodyPaint", label: "Kaporta & Boya Durumu" },
  { name: "engine", label: "Motor Performansı" },
  { name: "transmission", label: "Şanzıman / Vites Geçişleri" },
  { name: "suspension", label: "Yol Tutuş / Süspansiyon" },
  { name: "brakes", label: "Fren Sistemi" },
  { name: "electrical", label: "Elektronik Aksallar" },
  { name: "interior", label: "İç Kondisyon / Döşeme" },
  { name: "tires", label: "Lastik Durumu" },
  { name: "acHeating", label: "Klima / Isıtma Sistemi" },
] as const;

export function ExpertInspectionEditor({ form, isDisabled = false }: ExpertInspectionEditorProps) {
  const { register, watch, setValue } = form;

  const hasInspection = watch("expertInspection.hasInspection");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">Profesyonel Ekspertiz Raporu</h4>
            <p className="text-xs text-muted-foreground">
              İlanınıza güven katar, 5 kat daha hızlı satış sağlar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() =>
              !isDisabled &&
              setValue("expertInspection.hasInspection", false, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !hasInspection
                ? "bg-slate-200 text-foreground/90 shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            YOK
          </Button>
          <Button
            type="button"
            onClick={() =>
              !isDisabled &&
              setValue("expertInspection.hasInspection", true, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={isDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              hasInspection
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            VAR
          </Button>
        </div>
      </div>

      {hasInspection && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3 text-primary" />
                Ekspertiz Tarihi
              </Label>
              <Input
                type="date"
                {...register("expertInspection.inspectionDate")}
                disabled={isDisabled}
                className="rounded-xl h-11 border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3 text-primary" />
                Eksper / Kurum Adı
              </Label>
              <Input
                placeholder="Örn: Dynomark, Pilot Garage..."
                {...register("expertInspection.inspectedBy")}
                disabled={isDisabled}
                className="rounded-xl h-11 border-border focus:border-primary"
              />
            </div>
          </div>

          {/* Grade & Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Star className="size-3 text-primary" />
                Genel Değerlendirme
              </Label>
              <Select
                onValueChange={(val) =>
                  setValue("expertInspection.overallGrade", val as ExpertInspectionGrade, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={watch("expertInspection.overallGrade") ?? ""}
              >
                <SelectTrigger
                  disabled={isDisabled}
                  className="rounded-xl h-11 border-border focus:border-primary"
                >
                  <SelectValue placeholder="Not Seçin" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {expertInspectionGradeInfo.map((g) => (
                    <SelectItem key={g.grade} value={g.grade}>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="size-2 rounded-full" style={{ backgroundColor: g.color }} />
                        {g.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3 text-primary" />
                Toplam Puan (0-100)
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Örn: 92"
                {...register("expertInspection.totalScore", { valueAsNumber: true })}
                disabled={isDisabled}
                className="rounded-xl h-11 border-border focus:border-primary"
              />
            </div>
          </div>

          {/* Technical Status Grid */}
          <div className="bg-muted/30 rounded-2xl p-6 border border-border/50 overflow-visible">
            <h5 className="text-sm font-bold text-foreground mb-4">Teknik Aksam Durumları</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 overflow-visible">
              {INSPECTION_FIELDS.map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground ml-1">
                    {field.label}
                  </Label>
                  <div className="flex bg-background rounded-lg border border-border/60 p-0.5">
                    {expertInspectionStatusLabels.map((s) => (
                      <Button
                        key={s.status}
                        type="button"
                        onClick={() =>
                          !isDisabled &&
                          setValue(
                            `expertInspection.${field.name}` as "expertInspection.damageRecord",
                            s.status as ExpertInspectionStatus,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        disabled={isDisabled}
                        className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                          watch(
                            `expertInspection.${field.name}` as "expertInspection.damageRecord"
                          ) === s.status
                            ? s.status === "var"
                              ? "bg-emerald-100 text-emerald-700"
                              : s.status === "yok"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-muted text-foreground/90"
                            : "text-muted-foreground/60 hover:text-muted-foreground"
                        } ${isDisabled ? "cursor-not-allowed" : ""}`}
                      >
                        {watch(
                          `expertInspection.${field.name}` as "expertInspection.damageRecord"
                        ) === s.status &&
                          (s.status === "var" ? (
                            <CheckCircle2 size={10} />
                          ) : s.status === "yok" ? (
                            <XCircle size={10} />
                          ) : (
                            <HelpCircle size={10} />
                          ))}
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Eksper Notları / Önemli Tespitler
            </Label>
            <Textarea
              placeholder="Araçla ilgili eksperin vurguladığı özel durumları buraya yazabilirsiniz..."
              {...register("expertInspection.notes")}
              disabled={isDisabled}
              className="rounded-2xl min-h-24 border-border focus:border-primary text-sm"
            />
          </div>
        </div>
      )}

      {!hasInspection && (
        <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/20 flex flex-col items-center text-center">
          <HelpCircle className="size-10 text-muted-foreground/30 mb-3" />
          <h5 className="font-bold text-sm">Raporun Yok mu?</h5>
          <p className="text-xs text-muted-foreground max-w-[280px] mt-1">
            Ekspertiz raporun yoksa bu aşamayı boş bırakabilirsin. Ancak raporlu ilanlar alıcıların
            daha çok ilgisini çeker.
          </p>
        </div>
      )}
    </div>
  );
}
