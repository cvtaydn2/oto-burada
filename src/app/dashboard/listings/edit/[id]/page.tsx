import { requireUser } from "@/lib/auth/session";
import { getListingById } from "@/services/listings/marketplace-listings";
import { getLiveMarketplaceReferenceData } from "@/services/reference/live-reference-data";
import { getStoredProfileById } from "@/services/profile/profile-records";
import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { ChevronLeft, Edit3, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const listing = await getListingById(id);

  if (!listing) notFound();

  // Security check: only owner or admin can edit
  if (listing.sellerId !== user.id && user.user_metadata?.role !== "admin") {
    redirect("/dashboard/listings");
  }

  const [references, profile] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(user.id),
  ]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
           <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard/listings" className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xl shadow-slate-900/10 hover:scale-105 transition-transform">
                 <ChevronLeft className="size-5" />
              </Link>
              <div className="h-px w-12 bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">İlan Yönetimi</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tightest leading-tight text-slate-900 uppercase italic">
              İLAN <span className="text-primary">DÜZENLE</span>
           </h1>
           <p className="mt-4 text-sm font-medium text-slate-400 italic leading-relaxed">
              Aracınıza ait teknik verileri, güncel fiyat bilgisini ve kondisyon durumunu dijital ortamda güncelleyin.
           </p>
        </div>
        
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-4 italic max-w-sm">
           <div className="size-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
             <ShieldAlert size={18} />
           </div>
           <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed uppercase">
             Yapılan değişiklikler moderasyon ekibimiz tarafından tekrar incelenecektir.
           </p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-8 lg:p-12 border border-slate-100 shadow-2xl shadow-slate-200/40">
        <ListingCreateForm 
          brands={references.brands}
          cities={references.cities}
          initialListing={listing}
          initialValues={{
            city: profile?.city || "",
            whatsappPhone: profile?.phone || "",
          }}
          isPhoneVerified={profile?.phoneVerified}
        />
      </div>
    </div>
  );
}
