import { ListingCreateForm } from "@/components/forms/listing-create-form";
import { MyListingsPanel } from "@/components/listings/my-listings-panel";
import { requireUser } from "@/lib/auth/session";
import { getStoredUserListings } from "@/services/listings/listing-submissions";
import { Plus, ListChecks } from "lucide-react";

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
  const selectedListing = resolvedSearchParams?.edit
    ? storedListings.find(
        (l) =>
          l.id === resolvedSearchParams.edit &&
          (l.status === "draft" || l.status === "pending"),
      ) ?? null
    : null;

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

      {hasRequestedEdit && !selectedListing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          İlan bulunamadı veya düzenlenemez durumda.
        </div>
      )}

      <MyListingsPanel activeEditId={selectedListing?.id} listings={storedListings} />

      <section className="rounded-xl border border-border/60 bg-white p-5">
        <div className="flex items-center gap-2">
          <Plus className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">
            {selectedListing ? "İlanı Düzenle" : "Yeni İlan Ver"}
          </h3>
        </div>
        
        <div className="mt-4">
          <ListingCreateForm
            key={selectedListing?.id ?? "create-listing"}
            initialListing={selectedListing}
            initialValues={{
              city: metadata.city ?? "",
              whatsappPhone: metadata.phone ?? "",
            }}
          />
        </div>
      </section>
    </div>
  );
}
