import { allUsers, exampleListings } from "@/data";

export function getListingBySlug(slug: string) {
  return exampleListings.find((listing) => listing.slug === slug);
}

export function getListingSeller(sellerId: string) {
  return allUsers.find((user) => user.id === sellerId);
}

export function getSimilarListings(slug: string, brand: string, city: string) {
  const similarByBrand = exampleListings.filter(
    (listing) => listing.slug !== slug && listing.brand === brand,
  );

  if (similarByBrand.length >= 3) {
    return similarByBrand.slice(0, 3);
  }

  const similarByCity = exampleListings.filter(
    (listing) =>
      listing.slug !== slug &&
      listing.city === city &&
      !similarByBrand.some((brandMatch) => brandMatch.id === listing.id),
  );

  return [...similarByBrand, ...similarByCity].slice(0, 3);
}
