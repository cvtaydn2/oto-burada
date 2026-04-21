import type { Listing } from "@/types";
import { CalendarDays, CircleGauge, Fuel, Settings2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface SpecBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function SpecBox({ icon, label, value }: SpecBoxProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 touch-manipulation">
      <div className="size-10 sm:size-12 md:size-14 bg-slate-50 text-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-inner">
        {icon}
      </div>
      <div className="space-y-0.5 sm:space-y-1">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

interface ListingSpecsProps {
  listing: Listing;
}

export function ListingSpecs({ listing }: ListingSpecsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
      <SpecBox 
        icon={<CalendarDays className="size-5 sm:size-6" />} 
        label="Model Yılı" 
        value={String(listing.year)} 
      />
      <SpecBox 
        icon={<CircleGauge className="size-5 sm:size-6" />} 
        label="Kilometre" 
        value={`${formatNumber(listing.mileage)} km`} 
      />
      <SpecBox 
        icon={<Fuel className="size-5 sm:size-6" />} 
        label="Yakıt Tipi" 
        value={listing.fuelType} 
      />
      <SpecBox 
        icon={<Settings2 className="size-5 sm:size-6" />} 
        label="Vites Tipi" 
        value={listing.transmission} 
      />
    </div>
  );
}
