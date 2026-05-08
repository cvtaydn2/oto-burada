// SEO utilities
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
