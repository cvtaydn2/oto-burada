import { fuelTypes, listingSortOptions, maximumCarYear, maximumMileage, minimumCarYear, transmissionTypes } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { BrandCatalogItem, CityOption } from "@/data";
import type { ListingFilters, ListingSortOption } from "@/types";

interface ListingsFilterPanelProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  models: string[];
  districts: string[];
  isMobile?: boolean;
  onFilterChange: <K extends keyof ListingFilters>(
    key: K,
    value: ListingFilters[K],
  ) => void;
  onReset: () => void;
}

const sortLabels: Record<ListingSortOption, string> = {
  newest: "En yeni",
  price_asc: "Fiyat artan",
  price_desc: "Fiyat azalan",
  mileage_asc: "KM düşük",
  year_desc: "Model yılı yeni",
};

export function ListingsFilterPanel({
  brands,
  cities,
  filters,
  models,
  districts,
  isMobile = false,
  onFilterChange,
  onReset,
}: ListingsFilterPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/80 bg-background p-5 shadow-sm",
        isMobile && "max-h-[80vh] overflow-y-auto",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Filtreler</h2>
          <p className="text-sm text-muted-foreground">Aradığın aracı daha hızlı bul.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Temizle
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Arama</span>
          <input
            value={filters.query ?? ""}
            onChange={(event) => onFilterChange("query", event.target.value || undefined)}
            placeholder="Marka, model veya şehir"
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Sıralama</span>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event) => onFilterChange("sort", event.target.value as ListingSortOption)}
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          >
            {listingSortOptions.map((option) => (
              <option key={option} value={option}>
                {sortLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Marka</span>
            <select
              value={filters.brand ?? ""}
              onChange={(event) => onFilterChange("brand", event.target.value || undefined)}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Tümü</option>
              {brands.map((item) => (
                <option key={item.brand} value={item.brand}>
                  {item.brand}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Model</span>
            <select
              value={filters.model ?? ""}
              onChange={(event) => onFilterChange("model", event.target.value || undefined)}
              disabled={models.length === 0}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-muted"
            >
              <option value="">Tümü</option>
              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Şehir</span>
            <select
              value={filters.city ?? ""}
              onChange={(event) => onFilterChange("city", event.target.value || undefined)}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Tümü</option>
              {cities.map((item) => (
                <option key={item.city} value={item.city}>
                  {item.city}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>İlçe</span>
            <select
              value={filters.district ?? ""}
              onChange={(event) => onFilterChange("district", event.target.value || undefined)}
              disabled={districts.length === 0}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-muted"
            >
              <option value="">Tümü</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Yakıt</span>
            <select
              value={filters.fuelType ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "fuelType",
                  (event.target.value || undefined) as ListingFilters["fuelType"],
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Tümü</option>
              {fuelTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Vites</span>
            <select
              value={filters.transmission ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "transmission",
                  (event.target.value || undefined) as ListingFilters["transmission"],
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="">Tümü</option>
              {transmissionTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Min. fiyat</span>
            <input
              type="number"
              min="0"
              value={filters.minPrice ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "minPrice",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Maks. fiyat</span>
            <input
              type="number"
              min="0"
              value={filters.maxPrice ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "maxPrice",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium">
            <span>Min. yıl</span>
            <input
              type="number"
              min={minimumCarYear}
              max={maximumCarYear}
              value={filters.minYear ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "minYear",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Maks. yıl</span>
            <input
              type="number"
              min={minimumCarYear}
              max={maximumCarYear}
              value={filters.maxYear ?? ""}
              onChange={(event) =>
                onFilterChange(
                  "maxYear",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>

        <label className="block space-y-2 text-sm font-medium">
          <span>Maks. kilometre</span>
          <input
            type="number"
            min="0"
            max={maximumMileage}
            value={filters.maxMileage ?? ""}
            onChange={(event) =>
              onFilterChange(
                "maxMileage",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>
      </div>
    </div>
  );
}
