import { ChevronLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/features/auth/lib/session";
import { ListingCreateForm } from "@/features/forms/components/listing-create-form";
import { getListingById } from "@/features/marketplace/services/marketplace-listings";
import { getStoredProfileById } from "@/features/profile/services/profile-records";
import { getLiveMarketplaceReferenceData } from "@/features/shared/services/live-reference-data";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const listing = await getListingById(id);

  if (!listing) notFound();

  // Security: verify ownership using app_metadata (server-signed, not user-editable)
  // user_metadata CAN be updated by the user — do not use it for role checks.
  const appMetadata = user.app_metadata as { role?: string } | undefined;
  const isAdmin = appMetadata?.role === "admin";

  if (listing.sellerId !== user.id && !isAdmin) {
    redirect("/dashboard/listings");
  }

  // Only allow editing listings in editable states.
  // archived listings cannot be re-edited — they must be re-created.
  // approved listings can be re-submitted (will go back to pending after update).
  const editableStatuses: string[] = ["draft", "pending", "approved", "rejected"];
  if (!editableStatuses.includes(listing.status)) {
    redirect("/dashboard/listings");
  }

  const [references, profile] = await Promise.all([
    getLiveMarketplaceReferenceData(),
    getStoredProfileById(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/listings"
              className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted/30 hover:text-primary transition-colors"
            >
              <ChevronLeft className="size-4" />
            </Link>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              İlan Yönetimi
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">İlanı Düzenle</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Araç bilgilerini ve fiyat bilgisini güncelleyin.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-100 bg-amber-50 max-w-sm">
          <ShieldAlert size={16} className="text-amber-500 shrink-0" />
          <p className="text-xs font-medium text-amber-800 leading-relaxed">
            Yapılan değişiklikler moderasyon ekibimiz tarafından tekrar incelenecektir.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <ListingCreateForm
          brands={references.brands}
          cities={references.cities}
          initialListing={listing}
          initialValues={{
            city: profile?.city || "",
            whatsappPhone: profile?.phone || "",
          }}
          isEmailVerified={profile?.emailVerified}
        />
      </div>
    </div>
  );
}
