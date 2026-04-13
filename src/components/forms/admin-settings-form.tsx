"use client";

import { useState } from "react";
import { Save, Globe, Lock, Bell, Zap, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlatformSettings } from "@/services/admin/settings";
import { updatePlatformSettings } from "@/services/admin/settings";

interface AdminSettingsFormProps {
  initialSettings: PlatformSettings;
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updatePlatformSettings("general_appearance", settings.general_appearance),
        updatePlatformSettings("moderation_policies", settings.moderation_policies),
        updatePlatformSettings("notification_settings", settings.notification_settings),
      ]);
      toast.success("Sistem ayarları başarıyla güncellendi.");
    } catch (error) {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSubSetting = <
    K extends keyof PlatformSettings,
    S extends keyof PlatformSettings[K],
  >(
    category: K,
    key: S,
    value: PlatformSettings[K][S],
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
           <h1 className="text-2xl font-black text-slate-900">
             Sistem Konfigürasyonu
           </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium italic">Platformun global parametrelerini ve özellik bayraklarını yönetin.</p>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 gap-2 rounded-xl px-6 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5"
        >
           {isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
           Değişiklikleri Kaydet
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         {/* Site Appearance */}
         <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
               <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Globe size={24} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Genel Görünüm</h2>
            </div>
            
            <div className="space-y-5">
               <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Başlığı</Label>
                  <Input 
                    value={settings.general_appearance?.site_title}
                    onChange={(e) => updateSubSetting("general_appearance", "site_title", e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 font-bold" 
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Destek E-Posta</Label>
                  <Input 
                    value={settings.general_appearance?.support_email}
                    onChange={(e) => updateSubSetting("general_appearance", "support_email", e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 font-bold" 
                  />
               </div>
               <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 border border-slate-100">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Bakım Modu</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Siteyi geçici olarak dışa kapat</span>
                  </div>
                  <Switch 
                    checked={settings.general_appearance?.maintenance_mode}
                    onCheckedChange={(val) => updateSubSetting("general_appearance", "maintenance_mode", val)}
                  />
               </div>
            </div>
         </div>

         {/* Moderation Policies */}
         <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
               <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Lock size={24} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Moderasyon</h2>
            </div>
            
            <div className="space-y-5">
               <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 border border-slate-100">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Otomatik Onay</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Eski üyelerin ilanlarını otomatik yayınla</span>
                  </div>
                  <Switch 
                    checked={settings.moderation_policies?.auto_approve_regulars}
                    onCheckedChange={(val) => updateSubSetting("moderation_policies", "auto_approve_regulars", val)}
                  />
               </div>
               <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5 border border-slate-100">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">VIN Kontrolü</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">API üzerinden gerçeklik testi yap</span>
                  </div>
                  <Switch 
                    checked={settings.moderation_policies?.vin_check_enabled}
                    onCheckedChange={(val) => updateSubSetting("moderation_policies", "vin_check_enabled", val)}
                  />
               </div>
               <div className="flex items-center justify-between gap-4">
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Maksimum Ücretsiz İlan</Label>
                  <Input 
                    type="number" 
                    value={settings.moderation_policies?.max_free_listings}
                    onChange={(e) => updateSubSetting("moderation_policies", "max_free_listings", parseInt(e.target.value))}
                    className="h-10 rounded-xl bg-slate-50 border-transparent focus:bg-white w-24 text-center font-black" 
                  />
               </div>
            </div>
         </div>

         {/* Notification Settings */}
         <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
               <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Bell size={24} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Bildirimler</h2>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Slack Entegrasyonu</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Yeni ilanlar için kanal bildirimi</span>
                  </div>
                  <Switch 
                    checked={settings.notification_settings?.new_listing_slack}
                    onCheckedChange={(val) => updateSubSetting("notification_settings", "new_listing_slack", val)}
                  />
               </div>
               <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Rapor Uyarıları</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Adminlere anlık email gönder</span>
                  </div>
                  <Switch 
                    checked={settings.notification_settings?.report_email_alerts}
                    onCheckedChange={(val) => updateSubSetting("notification_settings", "report_email_alerts", val)}
                  />
               </div>
            </div>
         </div>

         {/* Advanced Performance */}
         <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-2">
               <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Zap size={24} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Performans</h2>
            </div>
            
            <div className="space-y-5">
               <div className="flex cursor-not-allowed items-center justify-between rounded-2xl border-2 border-dashed border-slate-100 p-5 opacity-50">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Önbellek Temizle</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Redis kayıtlarını sıfırla</span>
                  </div>
                  <Button variant="ghost" className="font-black text-[10px] tracking-widest text-slate-400" disabled>SIFIRLA</Button>
               </div>
               <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-5">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Hata Ayıklama (Debug)</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Detaylı sunucu loglarını aktif et</span>
                  </div>
                  <Switch defaultChecked />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
