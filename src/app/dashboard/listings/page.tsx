import { MyListingsPanel } from "@/components/listings/my-listings-panel";
import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { getLiveMarketplaceReferenceData, mergeCityOptions } from "@/services/reference/live-reference-data";
import { ListChecks } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface DashboardListingsPageProps {
  searchParams?: Promise<{
    edit?: string;
  }>;
}

export default async function DashboardListingsPage({ searchParams }: DashboardListingsPageProps) {
  const user = await requireUser();
  const metadata = user.user_metadata as {
    city?: string;
    phone?: string;
  };
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const hasRequestedEdit = Boolean(resolvedSearchParams?.edit);
  const storedListings = await getStoredUserListings(user.id);
  const references = await getLiveMarketplaceReferenceData();
  const selectedListing = resolvedSearchParams?.edit
    ? storedListings.find((l) => l.id === resolvedSearchParams.edit) ?? null
    : null;
  const mergedBrands = references.brands.some((item) => item.brand === selectedListing?.brand)
    ? references.brands
    : selectedListing?.brand
      ? [
          ...references.brands,
          {
            brand: selectedListing.brand,
            models: selectedListing.model ? [selectedListing.model] : [],
          },
        ].sort((left, right) => left.brand.localeCompare(right.brand, "tr"))
      : references.brands;
  const mergedCities = mergeCityOptions(references.cities, [
    metadata.city ?? "",
    selectedListing?.city ?? "",
  ]);

  const isEditingExisting = selectedListing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">İlanlarım</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {storedListings.length} ilan • {storedListings.filter((l) => l.status === "approved").length} yayında
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="size-4" />
          <span>Telefon: {metadata.phone ? "Kayıtlı" : "Yok"}</span>
        </div>
      </div>

      {hasRequestedEdit && !isEditingExisting && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          İlan bulunamadı.
        </div>
      )}

      <MyListingsPanel 
        activeEditId={selectedListing?.id} 
        listings={storedListings}
      >
        <div className="mt-4">
          <ListingCreateForm
            key={selectedListing?.id ?? "create-listing"}
            initialListing={selectedListing}
            initialValues={{
              city: metadata.city ?? "",
              whatsappPhone: metadata.phone ?? "",
            }}
            brands={mergedBrands}
            cities={mergedCities}
          />
        </div>
      </MyListingsPanel>
    </div>
  );
}
