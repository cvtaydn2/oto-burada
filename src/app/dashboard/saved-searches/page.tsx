import { SavedSearchesPanel } from "@/components/listings/saved-searches-panel";
import { requireUser } from "@/lib/auth/session";
import {
  createSearchParamsFromListingFilters,
  filterListings,
} from "@/services/listings/listing-filters";
import { getPublicMarketplaceListings } from "@/services/listings/marketplace-listings";
import { getStoredSavedSearchesByUser } from "@/services/saved-searches/saved-search-records";
import {
  buildSavedSearchSummary,
  getSavedSearchSignature,
} from "@/services/saved-searches/saved-search-utils";

export const dynamic = "force-dynamic";
// revalidate kaldırıldı — force-dynamic ile çakışıyor

export default async function DashboardSavedSearchesPage() {
  const user = await requireUser();

  const [savedSearches, listings] = await Promise.all([
    getStoredSavedSearchesByUser(user.id),
    getPublicMarketplaceListings({ limit: 200, page: 1, sort: "newest" }),
  ]);
  const resultCountBySignature = new Map(
    savedSearches.map((search) => [
      getSavedSearchSignature(search.filters),
      filterListings(listings.listings, search.filters).length,
    ]),
  );
  const savedSearchItems = savedSearches.map((search) => {
    const searchParams = createSearchParamsFromListingFilters(search.filters);

    if (search.filters.sort && search.filters.sort !== "newest") {
      searchParams.set("sort", search.filters.sort);
    }

    return {
      filtersSummary: buildSavedSearchSummary(search.filters),
      href: searchParams.toString() ? `/listings?${searchParams.toString()}` : "/listings",
      id: search.id ?? "",
      notificationsEnabled: search.notificationsEnabled,
      resultCount: resultCountBySignature.get(getSavedSearchSignature(search.filters)) ?? 0,
      title: search.title,
      updatedAt: search.updatedAt,
    };
  });

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">Kayıtlı Aramalar</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">İlgi alanlarına göre arama sonuçları</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Sık yaptığın filtre kombinasyonlarını kaydet, uygun ilanları tek dokunuşla tekrar aç ve
          bildirim tercihini buradan yönet.
        </p>
      </div>

      <SavedSearchesPanel initialSavedSearches={savedSearchItems} />
    </section>
  );
}
