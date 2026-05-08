import { CalendarDays, CircleGauge, Fuel, LucideIcon, Settings2 } from "lucide-react";

import { formatNumber } from "@/lib";

interface SpecItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface ListingSpecsProps {
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
}

export function ListingSpecs({ year, mileage, fuelType, transmission }: ListingSpecsProps) {
  const specs: SpecItem[] = [
    { icon: CalendarDays, label: "Model Yılı", value: String(year) },
    { icon: CircleGauge, label: "Kilometre", value: `${formatNumber(mileage)} km` },
    { icon: Fuel, label: "Yakıt", value: fuelType },
    { icon: Settings2, label: "Vites", value: transmission },
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-4 sm:gap-3 lg:gap-4">
      {specs.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-3 text-center shadow-sm sm:p-4"
        >
          <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground sm:size-10">
            <Icon size={18} />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
        </div>
      ))}
    </div>
  );
}
