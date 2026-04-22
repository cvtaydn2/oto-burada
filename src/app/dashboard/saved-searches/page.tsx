import { SavedSearchesPanel } from "@/components/listings/saved-searches-panel";
import { requireUser } from "@/lib/auth/session";
import { createSearchParamsFromListingFilters } from "@/services/listings/listing-filters";
import { getStoredSavedSearchesByUser } from "@/services/saved-searches/saved-search-records";
import { buildSavedSearchSummary } from "@/services/saved-searches/saved-search-utils";

export const dynamic = "force-dynamic";

export default async function DashboardSavedSearchesPage() {
  const user = await requireUser();

  const savedSearches = await getStoredSavedSearchesByUser(user.id);

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
      resultCount: 0,
      title: search.title,
      updatedAt: search.updatedAt,
    };
  });

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Kayıtlı Aramalar
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          İlgi alanlarına göre arama sonuçları
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Sık yaptığın filtre kombinasyonlarını kaydet, uygun ilanları tek dokunuşla tekrar aç ve
          bildirim tercihini buradan yönet.
        </p>
      </div>

      <SavedSearchesPanel initialSavedSearches={savedSearchItems} />
    </section>
  );
}
