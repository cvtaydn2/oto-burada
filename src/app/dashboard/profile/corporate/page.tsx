import { requireUser } from "@/lib/auth/session";
import { getStoredProfileById, buildProfileFromAuthUser } from "@/services/profile/profile-records";
import { CorporateProfileForm } from "@/components/forms/corporate-profile-form";
import { updateCorporateProfileAction } from "@/lib/auth/profile-actions";
import { Building2, ArrowLeft, CheckCircle2, Globe, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CorporateSettingsPage() {
  const user = await requireUser();
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/profile"
            className="size-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-200 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Kurumsal Mağaza Ayarları
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Profesyonel galeri kimliğinizi yönetin</p>
          </div>
        </div>
        {profile.verifiedBusiness && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
            <CheckCircle2 size={14} />
            DOĞRULANMIŞ İŞLETME
          </div>
        )}
      </div>

      {/* Info Banner */}
      {!profile.verifiedBusiness && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
          <Building2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Kurumsal Hesap Avantajları</p>
            <p className="text-xs text-blue-600 mt-1">
              Kurumsal mağaza açarak galeri sayfanızı oluşturun, tüm ilanlarınızı tek çatı altında toplayın ve alıcılara profesyonel bir görünüm sunun.
            </p>
          </div>
        </div>
      )}

      {/* Stats (if corporate) */}
      {profile.businessName && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-sm">
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Galeri Adı</p>
              <p className="text-sm font-bold text-slate-900 truncate">{profile.businessName}</p>
            </div>
          </div>
          {profile.websiteUrl && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-sm">
              <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Web Sitesi</p>
                <p className="text-sm font-bold text-slate-900 truncate">{profile.websiteUrl.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>
          )}
          {profile.businessAddress && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-sm">
              <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Adres</p>
                <p className="text-sm font-bold text-slate-900 truncate">{profile.businessAddress}</p>
              </div>
            </div>
          )}
        </div>
      )}

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
