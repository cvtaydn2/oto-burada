import { CircleGauge, Fuel, type LucideIcon, Settings2 } from "lucide-react";

interface StatProps {
  icon: LucideIcon;
  label: string;
  sub?: string;
}

export function ListingStat({ icon: Icon, label, sub }: StatProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/60 bg-muted/35 text-muted-foreground transition-[background-color,color,transform,border-color] duration-normal ease-standard group-hover:scale-[1.03] group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
        <Icon size={16} strokeWidth={2.25} />
      </div>
      <div className="flex min-w-0 items-baseline gap-1">
        <span className="truncate text-[12px] font-semibold text-foreground/80">{label}</span>
        {sub && <span className="text-[9px] font-bold uppercase text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

interface StatsGridProps {
  mileage: number;
  transmission: string | null;
  fuelType: string | null;
}

export function ListingStatsGrid({ mileage, transmission, fuelType }: StatsGridProps) {
  const transmissionLabel = TRANSMISSION_LABELS[transmission ?? ""] || transmission || "";
  const fuelTypeLabel = FUEL_TYPE_LABELS[fuelType ?? ""] || fuelType || "";

  return (
    <div className="grid grid-cols-3 gap-2.5 pt-1.5">
      <ListingStat icon={CircleGauge} label={`${mileage} km`} />
      <ListingStat icon={Settings2} label={transmissionLabel} />
      <ListingStat icon={Fuel} label={fuelTypeLabel} />
    </div>
  );
}

export const FUEL_TYPE_LABELS: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  lpg: "LPG",
  hybrid: "Hibrit",
  elektrik: "Elektrikli",
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  manuel: "Manuel",
  otomatik: "Otomatik",
  yari_otomatik: "Yarı Otomatik",
};
