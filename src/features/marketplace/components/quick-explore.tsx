import { CarFront, MapPin } from "lucide-react";
import Link from "next/link";

import type { BrandCatalogItem, CityOption } from "@/types";

interface QuickExploreProps {
  brands: BrandCatalogItem[];
  cities: CityOption[];
}

export function QuickExplore({ brands, cities }: QuickExploreProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Popüler Markalar
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/satilik/${brand.slug}`}
              prefetch={false}
              className="group flex min-h-[48px] items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:shadow-md sm:p-4"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
                <CarFront size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {brand.brand}
                </h4>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  {brand.models.length} model
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Popüler Şehirler
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/satilik-araba/${city.slug}`}
              prefetch={false}
              className="group flex min-h-[48px] items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent hover:shadow-md sm:p-4"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                  {city.city}
                </h4>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                  {city.districts.length} ilçe
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
