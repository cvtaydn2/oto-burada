export interface BrandCatalogItem {
  brand: string;
  models: string[];
}

export interface CityOption {
  city: string;
  cityPlate: number | null;
  districts: string[];
}

export interface SearchSuggestionItem {
  label: string;
  type: "brand" | "city" | "model";
  value: string;
}
