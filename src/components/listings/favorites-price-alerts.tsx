"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PriceAlertSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  priceThreshold: "2" | "5" | "10" | "any";
}

export function FavoritesPriceAlerts() {
  const [settings, setSettings] = useState<PriceAlertSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    priceThreshold: "5",
  });

  const handleToggle = (key: keyof PriceAlertSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThresholdChange = (value: string) => {
    setSettings((prev) => ({ ...prev, priceThreshold: value as PriceAlertSettings["priceThreshold"] }));
  };

  return (
    <Card className="relative overflow-hidden border-blue-100 bg-blue-50/50 shadow-sm">
      <div className="absolute top-0 left-0 h-full w-1 bg-blue-400"></div>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Bell className="text-blue-500" size={20} />
          Fiyat Düşüşü Uyarı Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Bildirim Kanalları</p>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/50 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => handleToggle("pushNotifications")}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-blue-500 after:absolute after:left-1 after:top-1 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4"></div>
                </div>
                <span className="text-sm font-medium text-slate-700">Mobil Uygulama (Push)</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/50 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle("emailNotifications")}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-blue-500 after:absolute after:left-1 after:top-1 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4"></div>
                </div>
                <span className="text-sm font-medium text-slate-700">E-posta Bilgilendirme</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/50 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={() => handleToggle("smsNotifications")}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-slate-200 peer-checked:bg-blue-500 after:absolute after:left-1 after:top-1 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4"></div>
                </div>
                <span className="text-sm font-medium text-slate-700">SMS Bildirimi</span>
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Fiyat Hassasiyeti</p>
            <p className="mb-3 text-xs text-slate-500">Fiyat en az ne kadar düştüğünde uyarı almak istersiniz?</p>
            
            <div className="space-y-2">
              {[
                { value: "2", label: "%2 ve Üzeri" },
                { value: "5", label: "%5 ve Üzeri" },
                { value: "10", label: "%10 ve Üzeri" },
                { value: "any", label: "Herhangi Bir Değişim" },
              ].map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-white/50 transition-colors">
                  <div className="relative">
                    <input
                      type="radio"
                      name="priceThreshold"
                      value={option.value}
                      checked={settings.priceThreshold === option.value}
                      onChange={() => handleThresholdChange(option.value)}
                      className="peer sr-only"
                    />
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 after:absolute after:left-1.5 after:top-1.5 after:h-2 after:w-2 after:rounded-full after:bg-white peer-checked:after:bg-white"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between pt-2">
            <p className="text-[10px] italic text-slate-400">
              * Ayarlar tüm favori ilanlarınız için geçerli olacaktır.
            </p>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <Check size={16} className="mr-2" />
              Ayarları Güncelle
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
