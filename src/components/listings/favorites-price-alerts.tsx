"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PriceAlertSettings {
  emailNotifications: boolean;
  priceThreshold: "2" | "5" | "10" | "any";
}

const STORAGE_KEY = "price-alert-settings";

const defaultSettings: PriceAlertSettings = {
  emailNotifications: true,
  priceThreshold: "5",
};

export function FavoritesPriceAlerts() {
  const [settings, setSettings] = useState<PriceAlertSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored) as PriceAlertSettings);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleThresholdChange = (value: string) => {
    setSettings((prev) => ({ ...prev, priceThreshold: value as PriceAlertSettings["priceThreshold"] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success("Uyarı ayarları kaydedildi.");
    } catch {
      toast.error("Ayarlar kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-blue-100 bg-blue-50/50 shadow-sm">
      <div className="absolute top-0 left-0 h-full w-1 bg-blue-400" />
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Bell className="text-blue-500" size={20} />
          Fiyat Düşüşü Uyarı Ayarları
          <span className="ml-auto rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
            Yerel Ayar
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">



          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Fiyat Hassasiyeti</p>
            <p className="mb-3 text-xs text-muted-foreground">Fiyat en az ne kadar düştüğünde bildirim almak istersiniz? (Tercihler cihazınıza kaydedilir.)</p>
            <div className="space-y-2">
              {[
                { value: "2", label: "%2 ve Üzeri" },
                { value: "5", label: "%5 ve Üzeri" },
                { value: "10", label: "%10 ve Üzeri" },
                { value: "any", label: "Herhangi Bir Değişim" },
              ].map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-card/50 transition-colors">
                  <div className="relative">
                    <input
                      type="radio"
                      name="priceThreshold"
                      value={option.value}
                      checked={settings.priceThreshold === option.value}
                      onChange={() => handleThresholdChange(option.value)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 rounded-full border-2 border-border peer-checked:border-blue-500 peer-checked:bg-blue-500 after:absolute after:left-1.5 after:top-1.5 after:h-2 after:w-2 after:rounded-full after:bg-card peer-checked:after:bg-card" />
                  </div>
                  <span className="text-sm font-medium text-foreground/90">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between pt-2">
            <p className="text-[10px] italic text-muted-foreground/70">
              * Ayarlar tüm favori ilanlarınız için geçerli olacaktır.
            </p>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleSave} disabled={isSaving}>
              <Check size={16} className="mr-2" />
              {isSaving ? "Kaydediliyor..." : "Tercihi Kaydet"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
