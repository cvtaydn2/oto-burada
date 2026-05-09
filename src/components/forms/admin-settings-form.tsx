"use client";

import {
  AlertTriangle,
  Bell,
  Globe,
  LoaderCircle,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlatformSettings,
  updateAllPlatformSettings,
} from "@/features/admin-moderation/services/settings";
import { captureClientException } from "@/lib/telemetry-client";
import { cn } from "@/lib/utils";

import { FieldBlock, SectionHeader, ToggleRow } from "./admin-settings-fields";
import { StatusSummaryCard } from "./admin-settings-stats";

interface AdminSettingsFormProps {
  initialSettings: PlatformSettings;
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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

  const settingsSummary = useMemo(
    () =>
      [
        {
          label: "Bakım modu",
          value: settings.general_appearance?.maintenance_mode ? "Aktif" : "Kapalı",
          tone: settings.general_appearance?.maintenance_mode ? "danger" : "default",
        },
        {
          label: "Otomatik onay",
          value: settings.moderation_policies?.auto_approve_regulars ? "Açık" : "Kapalı",
          tone: settings.moderation_policies?.auto_approve_regulars ? "success" : "default",
        },
        {
          label: "VIN kontrolü",
          value: settings.moderation_policies?.vin_check_enabled ? "Açık" : "Kapalı",
          tone: settings.moderation_policies?.vin_check_enabled ? "success" : "default",
        },
        {
          label: "Debug log",
          value: settings.performance?.debug_mode ? "Açık" : "Kapalı",
          tone: settings.performance?.debug_mode ? "warning" : "default",
        },
      ] as const,
    [settings]
  );

  return (
    <div
      className={cn(
        "space-y-6 transition-opacity duration-300",
        isSaving && "pointer-events-none opacity-70"
      )}
    >
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.45)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
              Sistem kontrolü
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sistem <span className="text-blue-600">Konfigürasyonu</span>
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
            Global davranışları, moderation eşiklerini ve operasyonel toggle’ları tek merkezden
            yönetin.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[320px] xl:items-end">
          {hasChanges ? (
            <Badge
              variant="outline"
              className="w-fit gap-1.5 border-amber-200 bg-amber-50 text-[10px] font-bold uppercase tracking-widest text-amber-700"
            >
              <AlertTriangle className="size-3.5" />
              Kaydedilmemiş değişiklikler var
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-widest text-emerald-700"
            >
              <ShieldCheck className="size-3.5" />
              Son durum kayıtla uyumlu
            </Badge>
          )}

          <div className="flex w-full flex-col gap-2 sm:flex-row xl:justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-11 flex-1 gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-700 xl:flex-none"
            >
              {isSaving ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Değişiklikleri Kaydet
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Auditability özeti
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
              Hangi kritik toggle’ların açık olduğunu hızlıca görün.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Bu alan karar öncesi kontrol listesi gibi davranır. Özellikle bakım modu ve debug log
              açıkken kaydetmeden önce etkisini doğrulayın.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <p className="font-semibold">Operasyon notu</p>
            <p className="mt-1 text-amber-800">
              Önbellek temizleme anlık aksiyondur; diğer alanlar ise yalnız{" "}
              <span className="font-semibold">Kaydet</span> ile kalıcı olur.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {settingsSummary.map((item) => (
            <StatusSummaryCard
              key={item.label}
              label={item.label}
              value={item.value}
              tone={item.tone}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <SectionHeader
            icon={Globe}
            title="Genel görünüm"
            description="Marka yüzeyi ve destek iletişim bilgisi gibi herkese açık ayarlar."
            tone="blue"
          />

          <div className="space-y-4">
            <FieldBlock
              label="Site başlığı"
              hint="Sekme başlığı ve üst seviye branding yüzeylerinde görünür."
            >
              <Input
                value={settings.general_appearance?.site_title ?? ""}
                onChange={(event) =>
                  updateSubSetting("general_appearance", "site_title", event.target.value)
                }
                className="h-11 rounded-xl border-border/70 bg-muted/20"
              />
            </FieldBlock>

            <FieldBlock
              label="Destek e-posta"
              hint="Destek dönüş adresi olarak kullanılır. Operasyon ekibi için erişilebilir kalmalı."
            >
              <Input
                type="email"
                value={settings.general_appearance?.support_email ?? ""}
                onChange={(event) =>
                  updateSubSetting("general_appearance", "support_email", event.target.value)
                }
                className="h-11 rounded-xl border-border/70 bg-muted/20"
              />
            </FieldBlock>

            <ToggleRow
              title="Bakım modu"
              description="Siteyi geçici olarak dış erişime kapatır. Açıkken canlı kullanıcı akışı etkilenir."
              checked={settings.general_appearance?.maintenance_mode ?? false}
              onCheckedChange={(value) =>
                updateSubSetting("general_appearance", "maintenance_mode", value)
              }
              danger={settings.general_appearance?.maintenance_mode ?? false}
              badge={settings.general_appearance?.maintenance_mode ? "Canlıda aktif" : "Kapalı"}
            />
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <SectionHeader
            icon={Lock}
            title="Moderasyon"
            description="İlan kabul eşiği ve güvenlik doğrulama katmanları."
            tone="amber"
          />

          <div className="space-y-4">
            <ToggleRow
              title="Otomatik onay"
              description="Güvenilir kullanıcı ilanlarını manuel bekleme olmadan yayına alır."
              checked={settings.moderation_policies?.auto_approve_regulars ?? false}
              onCheckedChange={(value) =>
                updateSubSetting("moderation_policies", "auto_approve_regulars", value)
              }
              badge={
                settings.moderation_policies?.auto_approve_regulars
                  ? "Hızlı akış"
                  : "Manuel kontrol"
              }
            />

            <ToggleRow
              title="VIN kontrolü"
              description="Araç verisini ek kontrol katmanından geçirir. Şüpheli girişlerde görünürlük artar."
              checked={settings.moderation_policies?.vin_check_enabled ?? false}
              onCheckedChange={(value) =>
                updateSubSetting("moderation_policies", "vin_check_enabled", value)
              }
              badge={settings.moderation_policies?.vin_check_enabled ? "Doğrulama aktif" : "Bypass"}
            />

            <FieldBlock
              label="Maksimum ücretsiz ilan"
              hint="Bireysel kullanıcı başına ücretsiz yayın limitini belirler."
              compact
            >
              <Input
                type="number"
                min={1}
                max={100}
                value={settings.moderation_policies?.max_free_listings ?? 3}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  if (!Number.isNaN(value) && value > 0) {
                    updateSubSetting("moderation_policies", "max_free_listings", value);
                  }
                }}
                className="h-11 w-full rounded-xl border-border/70 bg-muted/20 text-center font-semibold sm:w-28"
              />
            </FieldBlock>
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <SectionHeader
            icon={Bell}
            title="Bildirimler"
            description="Operasyon ekibine giden uyarı ve entegrasyon sinyalleri."
            tone="indigo"
          />

          <div className="space-y-4">
            <ToggleRow
              title="Slack entegrasyonu"
              description="Yeni ilan sinyalini ekibin Slack kanalına taşır."
              checked={settings.notification_settings?.new_listing_slack ?? false}
              onCheckedChange={(value) =>
                updateSubSetting("notification_settings", "new_listing_slack", value)
              }
              badge={
                settings.notification_settings?.new_listing_slack ? "Kanal bildirimi" : "Kapalı"
              }
            />

            <ToggleRow
              title="Rapor uyarıları"
              description="Admin raporlarında e-posta uyarısı üretir; yoğun abuse dönemlerinde operasyon netliği sağlar."
              checked={settings.notification_settings?.report_email_alerts ?? false}
              onCheckedChange={(value) =>
                updateSubSetting("notification_settings", "report_email_alerts", value)
              }
              badge={
                settings.notification_settings?.report_email_alerts ? "E-posta aktif" : "Kapalı"
              }
            />
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <SectionHeader
            icon={Zap}
            title="Performans"
            description="Anlık operasyon aksiyonları ve log yoğunluğu kontrolü."
            tone="emerald"
          />

          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Önbellek temizle</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Tüm sayfa önbelleklerini sıfırlar. Bu işlem anlıktır ve kaydet akışından
                    bağımsız yürür.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isClearingCache}
                  className="h-10 rounded-xl border-border/70 text-sm font-semibold hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  onClick={handleClearCache}
                >
                  {isClearingCache ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Önbelleği Temizle
                </Button>
              </div>
            </div>

            <ToggleRow
              title="Hata ayıklama modu"
              description="Detaylı sunucu loglarını açar. Sadece teşhis sürecinde aktif bırakın."
              checked={settings.performance?.debug_mode ?? false}
              onCheckedChange={(value) => updateSubSetting("performance", "debug_mode", value)}
              badge={settings.performance?.debug_mode ? "Yüksek log hacmi" : "Standart"}
              warning={settings.performance?.debug_mode ?? false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
