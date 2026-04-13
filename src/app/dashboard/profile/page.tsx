import { ProfileForm } from "@/components/forms/profile-form";
import { IdentityVerificationForm } from "@/components/forms/identity-verification-form";
import { updateProfileAction } from "@/lib/auth/profile-actions";
import { requireUser } from "@/lib/auth/session";
import { buildProfileFromAuthUser, getStoredProfileById } from "@/services/profile/profile-records";
import { getLiveMarketplaceReferenceData, mergeCityOptions } from "@/services/reference/live-reference-data";
import { CheckCircle2, Circle, User, Phone, MapPin, Mail, ShieldCheck, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function DashboardProfilePage() {
  const user = await requireUser();
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);
  const references = await getLiveMarketplaceReferenceData();
  const cityOptions = mergeCityOptions(references.cities, [profile.city]);

  const hasFullName = Boolean(profile.fullName);
  const hasPhone = Boolean(profile.phone);
  const hasCity = Boolean(profile.city);
  const completion = Math.round(
    ([hasFullName, hasPhone, hasCity].filter(Boolean).length / 3) * 100,
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <User className="text-primary italic" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Üyelik Merkezi</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
            PROFIL <span className="text-primary">AYARLARI</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 italic mt-1">Dijital showroom kimliğinizi ve erişim bilgilerinizi buradan yönetin.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right">
             <div className="flex items-center gap-2 justify-end">
                <span className="text-2xl font-black text-slate-900">{completion}%</span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Profil Tamamlama</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 flex flex-col gap-6">
               <div className="space-y-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Doğrulama Durumu</h3>
                 <div className="grid gap-3">
                    <VerificationItem label="E-posta Onayı" isVerified={profile.emailVerified} />
                    <VerificationItem label="Telefon Onayı" isVerified={profile.phoneVerified} />
                    <VerificationItem label="Kimlik Doğrulama" isVerified={profile.isVerified} />
                 </div>
               </div>

               <div className="h-px bg-slate-100" />

               <div className="space-y-4">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">İletişim Kanalları</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary transition-all">
                       <Mail className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                       <span className="text-sm font-bold text-slate-700 italic lowercase">{user.email}</span>
                    </div>
                    {hasPhone && (
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary transition-all">
                         <Phone className="size-4 text-slate-400 group-hover:text-primary transition-colors" />
                         <span className="text-sm font-bold text-slate-700 italic tracking-widest">{profile.phone}</span>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </section>

          <Link 
            href="/dashboard/profile/corporate"
            className="group flex items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 text-white hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
               <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Building2 size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black italic uppercase tracking-tighter">Kurumsal Mağaza</h4>
                  <p className="text-[10px] font-bold text-slate-400">Ticarî araç alım satımı için</p>
               </div>
            </div>
            <ShieldCheck size={20} className="text-primary group-hover:scale-110 transition-transform" />
          </Link>
        </div>

        <div className="lg:col-span-8 space-y-8">
           <section className="rounded-[3rem] border border-slate-100 bg-white p-8 lg:p-10 shadow-2xl shadow-slate-200/40 relative">
              <div className="flex items-center gap-3 mb-10">
                 <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 italic font-black text-xl">
                    <User size={24} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Kimlik Bilgileri</h3>
                    <p className="text-sm text-slate-500 font-medium">Bireysel bilgileriniz ilanlarınızda güvence olarak sergilenir.</p>
                 </div>
              </div>

              <ProfileForm
                action={updateProfileAction}
                initialValues={{
                  fullName: profile.fullName,
                  phone: profile.phone,
                  city: profile.city,
                  avatarUrl: profile.avatarUrl ?? "",
                }}
                cityOptions={cityOptions.map((item) => item.city)}
                isPhoneVerified={profile.phoneVerified}
              />
           </section>

           <div className="rounded-[3rem] bg-indigo-900 p-8 lg:p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none" />
              <IdentityVerificationForm userId={user.id} isVerified={profile.isVerified} />
           </div>
        </div>
      </div>
    </div>
  );
}

function VerificationItem({ label, isVerified }: { label: string; isVerified: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl border transition-all",
      isVerified 
        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
        : "bg-slate-50 border-slate-100 text-slate-400"
    )}>
       <span className="text-[11px] font-black uppercase tracking-[0.1em] italic">{label}</span>
       <div className={cn(
         "size-6 rounded-full border-2 flex items-center justify-center transition-all",
         isVerified ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "border-slate-200"
       )}>
          {isVerified && <CheckCircle2 size={14} strokeWidth={3} />}
       </div>
    </div>
  );
}

