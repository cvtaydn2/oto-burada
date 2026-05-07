"use client";

import { Bell, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { useState } from "react";

import type { NotificationPreferences } from "@/features/notifications/services/notification-preferences";
import { Button } from "@/features/ui/components/button";
import { Label } from "@/features/ui/components/label";

interface NotificationPreferencesPanelProps {
  initialPreferences: NotificationPreferences;
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <Label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </Button>
    </Label>
  );
}

export function NotificationPreferencesPanel({
  initialPreferences,
}: NotificationPreferencesPanelProps) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof Omit<NotificationPreferences, "userId">, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId: _uid, ...rest } = prefs;
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) throw new Error("Kayıt başarısız");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Tercihler kaydedilemedi. Lütfen tekrar dene.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl bg-card border border-border/60 p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Bell size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Bildirim Tercihleri</h2>
          <p className="text-xs text-muted-foreground">
            Hangi bildirimleri almak istediğinizi seçin
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* In-app notifications */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Bell size={14} className="text-muted-foreground/70" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Uygulama İçi
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            <ToggleRow
              label="Favori bildirimleri"
              description="Birisi ilanınızı favorilere eklediğinde"
              checked={prefs.notifyFavorite}
              onChange={(v) => update("notifyFavorite", v)}
            />
            <ToggleRow
              label="Moderasyon bildirimleri"
              description="İlanınız onaylandığında veya reddedildiğinde"
              checked={prefs.notifyModeration}
              onChange={(v) => update("notifyModeration", v)}
            />
            <ToggleRow
              label="Mesaj bildirimleri"
              description="Yeni mesaj aldığınızda"
              checked={prefs.notifyMessage}
              onChange={(v) => update("notifyMessage", v)}
            />
            <ToggleRow
              label="Fiyat düşüşü bildirimleri"
              description="Favorilediğiniz ilanın fiyatı düştüğünde"
              checked={prefs.notifyPriceDrop}
              onChange={(v) => update("notifyPriceDrop", v)}
            />
            <ToggleRow
              label="Kayıtlı arama bildirimleri"
              description="Kayıtlı aramanıza yeni ilan eklendiğinde"
              checked={prefs.notifySavedSearch}
              onChange={(v) => update("notifySavedSearch", v)}
            />
          </div>
        </div>

        {/* Email notifications */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Mail size={14} className="text-muted-foreground/70" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              E-posta
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            <ToggleRow
              label="Moderasyon e-postaları"
              description="İlan onay/red kararları e-posta ile bildirilsin"
              checked={prefs.emailModeration}
              onChange={(v) => update("emailModeration", v)}
            />
            <ToggleRow
              label="İlan sona erme uyarısı"
              description="İlanınız sona ermeden 7 gün önce hatırlatma"
              checked={prefs.emailExpiryWarning}
              onChange={(v) => update("emailExpiryWarning", v)}
            />
            <ToggleRow
              label="Kayıtlı arama e-postaları"
              description="Günlük yeni ilan özeti e-posta ile gelsin"
              checked={prefs.emailSavedSearch}
              onChange={(v) => update("emailSavedSearch", v)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        {saved && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={15} />
            Kaydedildi
          </div>
        )}
        <Button
          onClick={() => void handleSave()}
          disabled={saving}
          aria-busy={saving}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving && <LoaderCircle size={15} className="animate-spin" />}
          Tercihleri Kaydet
        </Button>
      </div>
    </section>
  );
}
