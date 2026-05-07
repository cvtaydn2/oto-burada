import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  MapPin,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { updateCorporateProfileAction } from "@/features/auth/lib/profile-actions";
import { requireUser } from "@/features/auth/lib/session";
import { CorporateProfileForm } from "@/features/forms/components/corporate-profile-form";
import { getSellerTrustUI } from "@/features/marketplace/lib/trust-ui";
import {
  buildProfileFromAuthUser,
  getStoredProfileById,
} from "@/features/profile/services/profile-records";
import { trust } from "@/features/shared/lib/ui-strings";

export const dynamic = "force-dynamic";

export default async function CorporateSettingsPage() {
  const user = await requireUser();
  const profile = (await getStoredProfileById(user.id)) ?? buildProfileFromAuthUser(user);

  const trustUI = getSellerTrustUI(profile);

  const isApproved = trustUI.isApproved;
  const isPending =
    trustUI.restrictionState === "restricted_review" && profile.verificationStatus === "pending";
  const isRejected = profile.verificationStatus === "rejected";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-3 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/profile"
            className="size-10 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-200 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kurumsal Mağaza Ayarları</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Profesyonel galeri kimliğinizi yönetin
            </p>
          </div>
        </div>

        {isApproved && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
            <CheckCircle2 size={14} />
            {trust.verifiedBusiness}
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
            <AlertTriangle size={14} />
            {trust.verificationPending}
          </div>
        )}
        {isRejected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
            <XCircle size={14} />
            {trust.verificationRejected}
          </div>
        )}
      </div>

      {/* Info/Warning Banner */}
      {isPending && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 tracking-tight uppercase tracking-widest">
              {trust.accountUnderReview}
            </p>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              {trust.verificationPendingDesc}
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 flex items-start gap-3">
          <XCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-800 tracking-tight uppercase tracking-widest">
              {trust.verificationRejected}
            </p>
            <p className="text-xs text-rose-600 mt-1 font-medium">
              {trust.verificationRejectedDesc}
            </p>
          </div>
        </div>
      )}

      {!isApproved && !isPending && !isRejected && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start gap-3">
          <Building2 size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Kurumsal Hesap Başvurusu</p>
            <p className="text-xs text-blue-600 mt-1">
              Kurumsal mağaza açarak galeri sayfanızı oluşturun, tüm ilanlarınızı tek çatı altında
              toplayın ve alıcılara profesyonel bir görünüm sunun. Başvurunuz ardından ekibimiz
              bilgilerinizi inceleyecektir.
            </p>
          </div>
        </div>
      )}

      {/* Stats (if corporate) */}
      {profile.businessName && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Galeri Adı</p>
              <p className="text-sm font-bold text-foreground truncate">{profile.businessName}</p>
            </div>
          </div>
          {profile.websiteUrl && (
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
              <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Web Sitesi</p>
                <p className="text-sm font-bold text-foreground truncate">
                  {profile.websiteUrl.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
          )}
          {profile.businessAddress && (
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 shadow-sm">
              <div className="size-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Adres</p>
                <p className="text-sm font-bold text-foreground truncate">
                  {profile.businessAddress}
                </p>
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
        isReadOnly={isPending}
      />
    </div>
  );
}
