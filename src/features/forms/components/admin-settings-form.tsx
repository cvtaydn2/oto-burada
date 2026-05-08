"use client";

import { AlertTriangle, Bell, Globe, LoaderCircle, Lock, RefreshCw, Save, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  PlatformSettings,
  updateAllPlatformSettings,
} from "@/features/admin-moderation/services/settings";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";
import { Switch } from "@/features/ui/components/switch";
import { cn } from "@/lib";
import { captureClientException } from "@/lib/telemetry-client";

interface AdminSettingsFormProps {
  initialSettings: PlatformSettings;
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state with server props after revalidation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(initialSettings);
    setHasChanges(false);
  }, [initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateAllPlatformSettings(settings);
      if (result.success) {
        toast.success("Ayarlar başarıyla kaydedildi.");
        setHasChanges(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Ayarlar kaydedilemedi.");
      }
    } catch (error) {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
      captureClientException(error, "admin_settings_save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      const res = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await res
        .json()
        .catch(() => ({ success: false, error: "Sunucu yanıtı okunamadı." }));
      if (res.ok && data.success) {
        toast.success("Önbellek başarıyla temizlendi.");
        router.refresh();
      } else {
        toast.error(data.error ?? "Önbellek temizlenemedi.");
        captureClientException(
          new Error(data.error || "Cache clear failed"),
          "admin_settings_cache_clear"
        );
      }
    } catch (error) {
      toast.error("Önbellek temizlenirken bir hata oluştu.");
      captureClientException(error, "admin_settings_cache_clear_fatal");
    } finally {
      setIsClearingCache(false);
    }
  };

  const updateSubSetting = <K extends keyof PlatformSettings, S extends keyof PlatformSettings[K]>(
    category: K,
    key: S,
    value: PlatformSettings[K][S]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  return (
    <div
      className={cn(
        "space-y-6 transition-opacity duration-300",
        isSaving && "opacity-70 pointer-events-none"
      )}
    >
      {/* Header */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistem Konfigürasyonu</h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium italic">
            Platformun global parametrelerini ve özellik bayraklarını yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-200 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase tracking-widest"
            >
              <AlertTriangle size={11} />
              Kaydedilmemiş değişiklikler
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="h-12 gap-2 rounded-xl px-6 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
          >
            {isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
            Değişiklikleri Kaydet
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Genel Görünüm */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Globe size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Genel Görünüm</h2>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">
                Site Başlığı
              </Label>
              <Input
                value={settings.general_appearance?.site_title ?? ""}
                onChange={(e) =>
                  updateSubSetting("general_appearance", "site_title", e.target.value)
                }
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-card focus:border-blue-300 focus:ring-4 focus:ring-blue-50 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">
                Destek E-Posta
              </Label>
              <Input
                type="email"
                value={settings.general_appearance?.support_email ?? ""}
                onChange={(e) =>
                  updateSubSetting("general_appearance", "support_email", e.target.value)
                }
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-card focus:border-blue-300 focus:ring-4 focus:ring-blue-50 font-bold"
              />
            </div>

            {/* Bakım Modu — kritik toggle, kırmızı uyarı ile */}
            <div
              className={cn(
                "flex items-center justify-between rounded-2xl p-5 border transition-colors",
                settings.general_appearance?.maintenance_mode
                  ? "bg-red-50 border-red-200"
                  : "bg-muted/30 border-border/50"
              )}
            >
              <div className="flex flex-col gap-1">
                <span
                  className={cn(
                    "text-sm font-bold uppercase tracking-tight",
                    settings.general_appearance?.maintenance_mode
                      ? "text-red-700"
                      : "text-foreground"
                  )}
                >
                  Bakım Modu
                  {settings.general_appearance?.maintenance_mode && (
                    <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                      AKTİF
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Siteyi geçici olarak dışa kapat
                </span>
              </div>
              <Switch
                checked={settings.general_appearance?.maintenance_mode ?? false}
                onCheckedChange={(val) =>
                  updateSubSetting("general_appearance", "maintenance_mode", val)
                }
              />
            </div>
          </div>
        </div>

        {/* Moderasyon */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Moderasyon</h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-5 border border-border/50">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  Otomatik Onay
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Eski üyelerin ilanlarını otomatik yayınla
                </span>
              </div>
              <Switch
                checked={settings.moderation_policies?.auto_approve_regulars ?? false}
                onCheckedChange={(val) =>
                  updateSubSetting("moderation_policies", "auto_approve_regulars", val)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-5 border border-border/50">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  VIN Kontrolü
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  API üzerinden gerçeklik testi yap
                </span>
              </div>
              <Switch
                checked={settings.moderation_policies?.vin_check_enabled ?? false}
                onCheckedChange={(val) =>
                  updateSubSetting("moderation_policies", "vin_check_enabled", val)
                }
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest ml-1">
                Maksimum Ücretsiz İlan
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.moderation_policies?.max_free_listings ?? 3}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    updateSubSetting("moderation_policies", "max_free_listings", val);
                  }
                }}
                className="h-10 rounded-xl bg-muted/30 border-transparent focus:bg-card w-24 text-center font-bold"
              />
            </div>
          </div>
        </div>

        {/* Bildirimler */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Bell size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Bildirimler</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-border/50 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  Slack Entegrasyonu
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Yeni ilanlar için kanal bildirimi
                </span>
              </div>
              <Switch
                checked={settings.notification_settings?.new_listing_slack ?? false}
                onCheckedChange={(val) =>
                  updateSubSetting("notification_settings", "new_listing_slack", val)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/50 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  Rapor Uyarıları
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Adminlere anlık email gönder
                </span>
              </div>
              <Switch
                checked={settings.notification_settings?.report_email_alerts ?? false}
                onCheckedChange={(val) =>
                  updateSubSetting("notification_settings", "report_email_alerts", val)
                }
              />
            </div>
          </div>
        </div>

        {/* Performans */}
        <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Zap size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground">Performans</h2>
          </div>

          <div className="space-y-5">
            {/* Önbellek Temizle — ayrı API çağrısı, kaydet butonuna bağlı değil */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-border/50 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  Önbellek Temizle
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Tüm sayfa önbelleklerini sıfırla
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isClearingCache}
                className="font-bold text-[10px] tracking-widest text-muted-foreground border-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all gap-1.5"
                onClick={handleClearCache}
              >
                {isClearingCache ? (
                  <LoaderCircle className="animate-spin" size={13} />
                ) : (
                  <RefreshCw size={13} />
                )}
                SIFIRLA
              </Button>
            </div>

            {/* Debug Mode — state'e bağlı, kaydet ile persist ediliyor */}
            <div className="flex items-center justify-between rounded-2xl border border-border/50 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                  Hata Ayıklama (Debug)
                </span>
                <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider italic">
                  Detaylı sunucu loglarını aktif et
                </span>
              </div>
              <Switch
                checked={settings.performance?.debug_mode ?? false}
                onCheckedChange={(val) => updateSubSetting("performance", "debug_mode", val)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
