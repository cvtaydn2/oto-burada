import { Settings, Save, Lock, Globe, Bell, Zap, SlidersHorizontal } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default async function AdminSettingsPage() {
  await requireAdminUser();

  return (
    <main className="p-8 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Settings className="text-slate-400" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Genel Ayarlar</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Sistem <span className="text-primary italic">Konfigürasyonu</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Platformun global parametrelerini ve özellik bayraklarını yönetin.</p>
        </div>
        
        <Button className="h-12 px-8 rounded-xl font-black uppercase tracking-tighter gap-2 shadow-lg shadow-primary/20">
           <Save size={18} />
           Değişiklikleri Kaydet
        </Button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Site Appearance */}
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Globe className="text-primary" size={24} />
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Genel Görünüm</h2>
            </div>
            
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Site Başlığı (Title)</Label>
                  <Input defaultValue="OtoBurada | Car Classifieds" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
               </div>
               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Destek E-Posta</Label>
                  <Input defaultValue="support@otoburada.com" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white" />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Bakım Modu</span>
                     <span className="text-xs text-slate-400">Siteyi geçici olarak dışa kapat</span>
                  </div>
                  <Switch />
               </div>
            </div>
         </div>

         {/* Moderation Policies */}
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Lock className="text-amber-500" size={24} />
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Moderasyon Politikaları</h2>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Otomatik Onay</span>
                     <span className="text-xs text-slate-400">Eski üyelerin ilanlarını beklemeden yayınla</span>
                  </div>
                  <Switch />
               </div>
               <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Şasi No (VIN) Kontrolü</span>
                     <span className="text-xs text-slate-400">API üzerinden gerçeklik testi yap</span>
                  </div>
                  <Switch defaultChecked />
               </div>
               <div className="space-y-2 pt-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Maksimum Ücretsiz İlan</Label>
                  <Input type="number" defaultValue="3" className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white w-24" />
               </div>
            </div>
         </div>

         {/* Notification Settings */}
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Bell className="text-indigo-500" size={24} />
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Bildirim Ayarları</h2>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Yeni İlan Bildirimi</span>
                     <span className="text-xs text-slate-400">Moderatorlere Slack bildirimi gönder</span>
                  </div>
                  <Switch defaultChecked />
               </div>
               <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Rapor Bildirimleri</span>
                     <span className="text-xs text-slate-400">Adminlere anlık email gönder</span>
                  </div>
                  <Switch />
               </div>
            </div>
         </div>

         {/* Advanced Performance */}
         <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <Zap className="text-primary" size={24} />
               <h2 className="text-xl font-black italic uppercase tracking-tighter">Performans ve Sistem</h2>
            </div>
            
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border-2 border-dashed border-slate-100 rounded-xl opacity-50 cursor-not-allowed">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">Önbellek (Cache) Temizle</span>
                     <span className="text-xs text-slate-400">Tüm Redis kayıtlarını sıfırla</span>
                  </div>
                  <Button variant="outline" size="sm" disabled>SIFIRLA</Button>
               </div>
               <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                  <div className="flex flex-col gap-1">
                     <span className="text-sm font-bold text-slate-900">API Loglama</span>
                     <span className="text-xs text-slate-400">Detaylı debug kayıtlarını tut</span>
                  </div>
                  <Switch defaultChecked />
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-center pt-8">
         <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50 grayscale hover:grayscale-0 transition-all opacity-40 hover:opacity-100">
            <SlidersHorizontal size={20} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Developer Debug Mode: Disabled</span>
         </div>
      </div>
    </main>
  );
}
