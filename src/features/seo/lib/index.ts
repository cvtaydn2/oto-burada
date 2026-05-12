export {
  buildAbsoluteUrl,
  buildListingDetailMetadata,
  buildListingsMetadata,
  getAppUrl,
} from "@/components/seo/structured-data";

export function generateMetaTags(title: string, description: string) {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}
