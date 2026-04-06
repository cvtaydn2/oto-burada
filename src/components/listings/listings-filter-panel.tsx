import { fuelTypes, listingSortOptions, maximumCarYear, maximumMileage, minimumCarYear, transmissionTypes } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type { BrandCatalogItem, CityOption } from "@/data";
import type { ListingFilters, ListingSortOption } from "@/types";

interface QuickPreset {
  description: string;
  id: string;
  label: string;
}

interface ListingsFilterPanelProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
  filters: ListingFilters;
  models: string[];
  districts: string[];
  isMobile?: boolean;
  quickPresets?: QuickPreset[];
  onApplyPreset?: (presetId: string) => void;
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
  quickPresets = [],
  onApplyPreset,
  onFilterChange,
  onReset,
}: ListingsFilterPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
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
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Temizle
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {quickPresets.length > 0 ? (
          <div className="space-y-3 rounded-[1.25rem] border border-primary/10 bg-primary/5 p-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Akilli secimler</h3>
              <p className="text-xs leading-5 text-muted-foreground">
                Tek dokunusla sik kullanilan filtre kombinasyonlarini uygula.
              </p>
            </div>
            <div className="grid gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset?.(preset.id)}
                  className="rounded-xl border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <label className="block space-y-2 text-sm font-medium">
          <span>Arama</span>
          <input
            value={filters.query ?? ""}
            onChange={(event: any) => onFilterChange("query", event.target.value || undefined)}
            placeholder="Marka, model veya şehir"
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium">
          <span>Sıralama</span>
          <select
            value={filters.sort ?? "newest"}
            onChange={(event: any) => onFilterChange("sort", event.target.value as ListingSortOption)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) => onFilterChange("brand", event.target.value || undefined)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) => onFilterChange("model", event.target.value || undefined)}
              disabled={models.length === 0}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
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
              onChange={(event: any) => onFilterChange("city", event.target.value || undefined)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) => onFilterChange("district", event.target.value || undefined)}
              disabled={districts.length === 0}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50"
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
              onChange={(event: any) =>
                onFilterChange(
                  "fuelType",
                  (event.target.value || undefined) as ListingFilters["fuelType"],
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) =>
                onFilterChange(
                  "transmission",
                  (event.target.value || undefined) as ListingFilters["transmission"],
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) =>
                onFilterChange(
                  "minPrice",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Maks. fiyat</span>
            <input
              type="number"
              min="0"
              value={filters.maxPrice ?? ""}
              onChange={(event: any) =>
                onFilterChange(
                  "maxPrice",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
              onChange={(event: any) =>
                onFilterChange(
                  "minYear",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Maks. yıl</span>
            <input
              type="number"
              min={minimumCarYear}
              max={maximumCarYear}
              value={filters.maxYear ?? ""}
              onChange={(event: any) =>
                onFilterChange(
                  "maxYear",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
            onChange={(event: any) =>
              onFilterChange(
                "maxMileage",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </div>
    </div>
  );
}
