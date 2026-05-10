import type { DashboardEditableListing } from "@/features/marketplace/types/dashboard-listings";
import type { BrandCatalogItem, CityOption, Listing } from "@/types";

import { ListingCreateFormRenderer } from "./listing-create-form-renderer";

interface ListingCreateFormProps {
  initialValues: { city: string; whatsappPhone: string };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: DashboardEditableListing | null;
  isEmailVerified?: boolean;
  focusMode?: "default" | "trust";
  successRedirectPath?: string;
  trustFlowTransition?: {
    mode: "next" | "done";
    nextListingTitle: string | null;
    remainingCount: number;
  };
}

function adaptInitialListing(
  listing?: DashboardEditableListing | null
): Listing | null | undefined {
  if (!listing) {
    return listing;
  }

  return listing as unknown as Listing;
}

export function ListingCreateForm({ initialListing, ...props }: ListingCreateFormProps) {
  return (
    <ListingCreateFormRenderer {...props} initialListing={adaptInitialListing(initialListing)} />
  );
}
