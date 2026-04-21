import { ShieldCheck, Zap } from "lucide-react";
import { ExpertInspectionCard } from "@/components/listings/expert-inspection-card";
import { DamageReportCard } from "@/components/listings/damage-report-card";
import { SectionHeader } from "@/components/shared/design-system/SectionHeader";
import { Panel } from "@/components/shared/design-system/Panel";
import type { Listing } from "@/types";

interface ListingReportSectionProps {
  listing: Listing;
}

export function ListingReportSection({ listing }: ListingReportSectionProps) {
  return (
    <div id="ekspertiz" className="scroll-mt-24 space-y-10">
      <Panel padding="xl">
        <SectionHeader 
          title="Ekspertiz Raporu" 
          icon={ShieldCheck}
          action={listing.expertInspection?.documentUrl && (
            <a
              href={listing.expertInspection.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl bg-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all"
            >
              PDF RAPORU GÖRÜNTÜLE
            </a>
          )}
        />
        <ExpertInspectionCard expertInspection={listing.expertInspection} />
      </Panel>

      <Panel padding="xl">
        <SectionHeader 
          title="Kaporta & Boya Durumu" 
          icon={Zap} 
        />
        <DamageReportCard 
          damageStatus={listing.damageStatusJson} 
          tramerAmount={listing.tramerAmount} 
        />
      </Panel>
    </div>
  );
}
