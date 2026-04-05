import { ListingsPageClient } from "@/components/listings/listings-page-client";
import { brandCatalog, cityOptions, exampleListings } from "@/data";

export default function ListingsPage() {
  return (
    <ListingsPageClient
      listings={exampleListings}
      brands={brandCatalog}
      cities={cityOptions}
    />
  );
}
