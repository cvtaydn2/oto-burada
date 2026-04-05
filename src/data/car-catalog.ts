export interface BrandCatalogItem {
  brand: string;
  models: string[];
}

export const brandCatalog: BrandCatalogItem[] = [
  { brand: "Volkswagen", models: ["Golf", "Passat", "Polo", "Tiguan"] },
  { brand: "Renault", models: ["Clio", "Megane", "Taliant", "Captur"] },
  { brand: "Fiat", models: ["Egea", "Linea", "500L"] },
  { brand: "Toyota", models: ["Corolla", "C-HR", "Yaris"] },
  { brand: "Ford", models: ["Focus", "Fiesta", "Puma", "Kuga"] },
  { brand: "BMW", models: ["320i", "520d", "X1", "X3"] },
  { brand: "Mercedes-Benz", models: ["A 180", "C 200", "E 200"] },
  { brand: "Hyundai", models: ["i20", "i30", "Bayon", "Tucson"] },
  { brand: "Honda", models: ["Civic", "City", "HR-V"] },
  { brand: "Peugeot", models: ["208", "308", "3008", "408"] },
];
