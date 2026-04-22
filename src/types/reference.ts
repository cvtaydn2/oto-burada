export interface BrandCatalogItem {
  brand: string;
  slug: string;
  name: string;
  image_url?: string | null;
  models: {
    name: string;
    trims: string[];
  }[];
}

export interface CityOption {
  city: string;
  slug: string;
  cityPlate: number | null;
  districts: string[];
}

export interface SearchSuggestionItem {
  label: string;
  type: "brand" | "city" | "model";
  value: string;
}

export interface CategoryOption {
  category: string;
  slug: string;
  count: number;
}
