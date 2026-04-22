import {
  carPartDamageStatuses,
  carParts,
  maximumCarYear,
  minimumListingImages,
} from "@/lib/constants/domain";
import { type Listing, type ListingCreateFormValues } from "@/types";

const damageStatusAliases: Record<string, string> = { orijinal: "orjinal" };
const carPartAliases: Record<string, string> = {
  soloncamurluk: "sol_on_camurluk",
  sagoncamurluk: "sag_on_camurluk",
  solarkacamurluk: "sol_arka_camurluk",
  sagarkacamurluk: "sag_arka_camurluk",
  solonkapi: "sol_on_kapi",
  sagonkapi: "sag_on_kapi",
  solarkakapi: "sol_arka_kapi",
  sagarkakapi: "sag_arka_kapi",
  ontampon: "on_tampon",
  arkatampon: "arka_tampon",
};

export function normalizeDamagePartKey(key: string) {
  const normalized = key
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (carParts.includes(normalized as (typeof carParts)[number])) return normalized;
  return carPartAliases[normalized.replace(/_/g, "")] ?? null;
}

export function normalizeDamageStatusValue(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const canonical = damageStatusAliases[normalized] ?? normalized;
  return carPartDamageStatuses.includes(canonical as (typeof carPartDamageStatuses)[number])
    ? canonical
    : null;
}

export function normalizeDamageStatusJson(raw?: Record<string, unknown> | null) {
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .map(([k, v]) => {
        const canonicalKey = normalizeDamagePartKey(k);
        const canonicalVal = normalizeDamageStatusValue(v);
        return canonicalKey && canonicalVal && canonicalVal !== "orjinal"
          ? [canonicalKey, canonicalVal]
          : null;
      })
      .filter((e): e is [string, string] => e !== null)
  );
}

export function buildDefaultValues(
  initialValues: { city: string; whatsappPhone: string },
  initialListing?: Listing | null
): ListingCreateFormValues {
  const sortedImages = initialListing
    ? [...initialListing.images].sort((a, b) => a.order - b.order)
    : [];
  const rawInspection = initialListing?.expertInspection;

  const normalizedInspection =
    rawInspection && typeof rawInspection === "object"
      ? {
          ...rawInspection,
          hasInspection: rawInspection.hasInspection ?? false,
          damageRecord: rawInspection.damageRecord ?? "bilinmiyor",
          bodyPaint: rawInspection.bodyPaint ?? "bilinmiyor",
          engine: rawInspection.engine ?? "bilinmiyor",
          transmission: rawInspection.transmission ?? "bilinmiyor",
          suspension: rawInspection.suspension ?? "bilinmiyor",
          brakes: rawInspection.brakes ?? "bilinmiyor",
          electrical: rawInspection.electrical ?? "bilinmiyor",
          interior: rawInspection.interior ?? "bilinmiyor",
          tires: rawInspection.tires ?? "bilinmiyor",
          acHeating: rawInspection.acHeating ?? "bilinmiyor",
        }
      : {
          hasInspection: false,
          damageRecord: "bilinmiyor",
          bodyPaint: "bilinmiyor",
          engine: "bilinmiyor",
          transmission: "bilinmiyor",
          suspension: "bilinmiyor",
          brakes: "bilinmiyor",
          electrical: "bilinmiyor",
          interior: "bilinmiyor",
          tires: "bilinmiyor",
          acHeating: "bilinmiyor",
        };

  return {
    title: initialListing?.title ?? "",
    brand: initialListing?.brand ?? "",
    model: initialListing?.model ?? "",
    carTrim: initialListing?.carTrim ?? null,
    year: initialListing?.year ?? Math.min(new Date().getFullYear(), maximumCarYear),
    mileage: initialListing?.mileage ?? 0,
    fuelType: initialListing?.fuelType ?? "benzin",
    transmission: initialListing?.transmission ?? "manuel",
    price: initialListing?.price ?? 0,
    city: initialListing?.city ?? initialValues.city,
    district: initialListing?.district ?? "",
    description: initialListing?.description ?? "",
    whatsappPhone: initialListing?.whatsappPhone ?? initialValues.whatsappPhone,
    licensePlate: initialListing?.licensePlate ?? "",
    vin: initialListing?.vin ?? "",
    tramerAmount: initialListing?.tramerAmount ?? 0,
    damageStatusJson: normalizeDamageStatusJson(initialListing?.damageStatusJson),
    images:
      sortedImages.length > 0
        ? sortedImages.map((img) => ({
            fileName: img.storagePath.split("/").pop(),
            storagePath: img.storagePath,
            url: img.url,
            placeholderBlur: img.placeholderBlur ?? null,
            imageType: (img.type === "360" ? "360" : "photo") as "photo" | "360",
          }))
        : Array.from({ length: minimumListingImages }, () => ({ imageType: "photo" as const })),
    expertInspection: normalizedInspection as ListingCreateFormValues["expertInspection"],
  };
}
