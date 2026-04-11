import { type Profile } from "@/types"
import { MapPin, Globe, Phone, ShieldCheck, Calendar, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface GalleryHeaderProps {
  profile: Profile
}

export function GalleryHeader({ profile }: GalleryHeaderProps) {
  return (
    <div className="bg-white border-b border-border shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Logo / Avatar */}
          <div className="size-32 sm:size-40 rounded-3xl bg-slate-50 border border-slate-100 p-4 shrink-0 flex items-center justify-center relative shadow-sm">
            {profile.businessLogoUrl ? (
              <img 
                src={profile.businessLogoUrl} 
                alt={profile.businessName || profile.fullName} 
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-4xl font-black text-primary italic uppercase">
                {(profile.businessName || profile.fullName).substring(0, 2)}
              </div>
            )}
            
            {profile.verifiedBusiness && (
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-xl border-4 border-white shadow-lg">
                <ShieldCheck size={20} />
              </div>
            )}
          </div>

          {/* Info Side */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-black tracking-tight italic uppercase">
                  {profile.businessName || profile.fullName}
                </h1>
                <Badge className="bg-primary/10 text-primary border-none font-bold px-3 py-1">
                  KURUMSAL GALERİ
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" />
                  {profile.city || "Şehir Belirtilmemiş"}
                </div>
                {profile.websiteUrl && (
                  <a 
                    href={profile.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Globe size={16} />
                    {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-slate-400" />
                  {new Date(profile.createdAt).getFullYear()}'den beri üye
                </div>
              </div>
            </div>

            {profile.businessDescription && (
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                {profile.businessDescription}
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
               {/* Contact Actions can go here if needed */}
               <div className="flex items-center gap-4 py-2 px-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Galerici İletişim</p>
                    <p className="text-sm font-black text-slate-700">{profile.phone}</p>
                  </div>
               </div>
               
               {profile.taxId && (
                 <div className="flex items-center gap-4 py-2 px-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Vergi Levhalı İşletme</p>
                      <p className="text-sm font-black text-slate-700">{profile.taxOffice} / {profile.taxId}</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
