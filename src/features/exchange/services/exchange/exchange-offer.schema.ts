import { z } from "zod";

const currentYear = new Date().getFullYear() + 1;

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function emptyToNull(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export const exchangeOfferIdSchema = z.string().uuid("Geçersiz teklif kimliği.");
export const exchangeListingIdSchema = z.string().uuid("Geçersiz ilan kimliği.");

export const createExchangeOfferSchema = z.object({
  listingId: exchangeListingIdSchema,
  targetListingId: z.preprocess(
    emptyToNull,
    z.string().uuid("Geçersiz takas ilanı kimliği.").nullable().optional()
  ),
  targetCarDesc: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(10, "Araç açıklaması en az 10 karakter olmalıdır.")
      .max(1500, "Araç açıklaması en fazla 1500 karakter olabilir.")
  ),
  targetPrice: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        message: "Takas araç değeri sayısal olmalıdır.",
      })
      .finite("Takas araç değeri geçerli bir sayı olmalıdır.")
      .min(0, "Takas araç değeri negatif olamaz.")
      .max(1_000_000_000, "Takas araç değeri çok yüksek görünüyor.")
      .optional()
  ),
  targetBrand: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(80, "Marka en fazla 80 karakter olabilir.").optional()
  ),
  targetModel: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120, "Model en fazla 120 karakter olabilir.").optional()
  ),
  targetYear: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        message: "Model yılı sayısal olmalıdır.",
      })
      .int("Model yılı tam sayı olmalıdır.")
      .min(1950, "Model yılı 1950'den küçük olamaz.")
      .max(currentYear, `Model yılı en fazla ${currentYear} olabilir.`)
      .optional()
  ),
  targetMileage: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .number({
        message: "Kilometre sayısal olmalıdır.",
      })
      .int("Kilometre tam sayı olmalıdır.")
      .min(0, "Kilometre negatif olamaz.")
      .max(3_000_000, "Kilometre çok yüksek görünüyor.")
      .optional()
  ),
  notes: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1000, "Notlar en fazla 1000 karakter olabilir.").optional()
  ),
});

export const respondToExchangeOfferSchema = z.object({
  offerId: exchangeOfferIdSchema,
  response: z.enum(["accepted", "rejected"], {
    message: "Geçersiz teklif yanıtı.",
  }),
});

export type CreateExchangeOfferSchemaInput = z.infer<typeof createExchangeOfferSchema>;
export type RespondToExchangeOfferSchemaInput = z.infer<typeof respondToExchangeOfferSchema>;
