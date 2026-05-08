import type { BrandCatalogItem, CityOption, Listing } from "@/types";

import { ListingCreateFormRenderer } from "./listing-create-form-renderer";

interface ListingCreateFormProps {
  initialValues: { city: string; whatsappPhone: string };
  brands: BrandCatalogItem[];
  cities: CityOption[];
  initialListing?: Listing | null;
  isEmailVerified?: boolean;
}

export function ListingCreateForm(props: ListingCreateFormProps) {
  return <ListingCreateFormRenderer {...props} />;
}
