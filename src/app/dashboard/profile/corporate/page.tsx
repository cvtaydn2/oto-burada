import { requireUser } from "@/lib/auth/session";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { CorporateProfileForm } from "@/components/forms/corporate-profile-form";
import { updateCorporateProfileAction } from "@/lib/auth/profile-actions";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CorporateSettingsPage() {
  const user = await requireUser();
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/profile"
              className="size-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                Kurumsal <span className="text-primary">Mağaza Ayarları</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium">Profesyonel galeri kimliğinizi yönetin</p>
            </div>
         </div>
         {profile.verifiedBusiness && (
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200">
              <Building2 size={14} />
              DOĞRULANMIŞ İŞLETME
           </div>
         )}
      </div>

      <CorporateProfileForm 
        action={updateCorporateProfileAction} 
        initialValues={{
          businessName: profile.businessName ?? "",
          businessSlug: profile.businessSlug ?? "",
          businessAddress: profile.businessAddress ?? "",
          businessDescription: profile.businessDescription ?? "",
          taxId: profile.taxId ?? "",
          taxOffice: profile.taxOffice ?? "",
          websiteUrl: profile.websiteUrl ?? "",
          businessLogoUrl: profile.businessLogoUrl ?? "",
        }}
      />
    </div>
  );
}
