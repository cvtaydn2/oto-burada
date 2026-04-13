import { Settings, Save, Lock, Globe, Bell, Zap, SlidersHorizontal } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default async function AdminSettingsPage() {
  await requireAdminUser();

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Settings className="text-slate-400" size={16} />
             <span className="text-xs text-slate-500">Genel ayarlar</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sistem konfigürasyonu
          </h1>
          <p className="mt-1 text-sm text-slate-500">Platformun global parametrelerini ve özellik bayraklarını yönetin.</p>
        </div>
        
        <Button className="h-10 gap-2 rounded-md px-4 text-sm font-medium">
           <Save size={18} />
           Değişiklikleri Kaydet
        </Button>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
         {/* Site Appearance */}
         <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-2">
               <Globe className="text-primary" size={24} />
               <h2 className="text-lg font-semibold">Genel görünüm</h2>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Site Başlığı (Title)</Label>
                  <Input defaultValue="OtoBurada | Car Classifieds" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500">Destek E-Posta</Label>
                  <Input defaultValue="support@otoburada.com" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
               </div>
               <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Bakım Modu</span>
                     <span className="text-xs text-slate-400">Siteyi geçici olarak dışa kapat</span>
                  </div>
                  <Switch />
               </div>
            </div>
         </div>

         {/* Moderation Policies */}
         <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-2">
               <Lock className="text-amber-500" size={24} />
               <h2 className="text-lg font-semibold">Moderasyon politikaları</h2>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Otomatik Onay</span>
                     <span className="text-xs text-slate-400">Eski üyelerin ilanlarını beklemeden yayınla</span>
                  </div>
                  <Switch />
               </div>
               <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Şasi No (VIN) Kontrolü</span>
                     <span className="text-xs text-slate-400">API üzerinden gerçeklik testi yap</span>
                  </div>
                  <Switch defaultChecked />
               </div>
               <div className="space-y-2 pt-2">
                  <Label className="text-xs font-medium text-slate-500">Maksimum Ücretsiz İlan</Label>
                  <Input type="number" defaultValue="3" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white w-24" />
               </div>
            </div>
         </div>

         {/* Notification Settings */}
         <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-2">
               <Bell className="text-indigo-500" size={24} />
               <h2 className="text-lg font-semibold">Bildirim ayarları</h2>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Yeni İlan Bildirimi</span>
                     <span className="text-xs text-slate-400">Moderatorlere Slack bildirimi gönder</span>
                  </div>
                  <Switch defaultChecked />
               </div>
               <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Rapor Bildirimleri</span>
                     <span className="text-xs text-slate-400">Adminlere anlık email gönder</span>
                  </div>
                  <Switch />
               </div>
            </div>
         </div>

         {/* Advanced Performance */}
         <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3 mb-2">
               <Zap className="text-primary" size={24} />
               <h2 className="text-lg font-semibold">Performans ve sistem</h2>
            </div>
            
            <div className="space-y-4">
               <div className="flex cursor-not-allowed items-center justify-between rounded-lg border-2 border-dashed border-slate-200 p-4 opacity-50">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Önbellek (Cache) Temizle</span>
                     <span className="text-xs text-slate-400">Tüm Redis kayıtlarını sıfırla</span>
                  </div>
                  <Button variant="outline" size="sm" disabled>SIFIRLA</Button>
               </div>
               <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">API Loglama</span>
                     <span className="text-xs text-slate-400">Detaylı debug kayıtlarını tut</span>
                  </div>
                  <Switch defaultChecked />
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center pt-4">
         <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100/50 p-3 opacity-60 transition-all hover:opacity-100">
            <SlidersHorizontal size={20} className="text-slate-400" />
            <span className="text-xs text-slate-500">Developer Debug Mode: Disabled</span>
         </div>
      </div>
    </main>
  );
}
