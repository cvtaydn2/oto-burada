export const vehicleCategories = [
  "otomobil",
  "arazi_suv_pickup",
  "elektrikli_arac",
  "minivan_panelvan",
  "ticari_arac",
  "klasik_arac",
  "hasarli_arac",
] as const;

export type VehicleCategory = (typeof vehicleCategories)[number];

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  otomobil: "Otomobil",
  arazi_suv_pickup: "Arazi, SUV & Pick-up",
  elektrikli_arac: "Elektrikli Araç",
  minivan_panelvan: "Minivan & Panelvan",
  ticari_arac: "Ticari Araç",
  klasik_arac: "Klasik Araç",
  hasarli_arac: "Hasarlı Araç",
};
