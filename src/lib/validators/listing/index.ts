import { z } from "zod";

import {
  fuelTypes,
  listingStatuses,
  maximumCarYear,
  maximumMileage,
  minimumCarYear,
  transmissionTypes,
} from "@/lib/domain";
import { vehicleCategories } from "@/lib/vehicle-categories";
import type { Listing } from "@/types";

import { profileSchema } from "../auth";
import {
  invalidMessage,
  lenientPhoneSchema,
  nonNegativeNumberSchema,
  optionalTrimmedString,
  positiveCurrencySchema,
  timestampSchema,
  trimmedRequiredString,
} from "../shared";
import { listingImageSchema } from "./images";
import { expertInspectionSchema } from "./inspection";

export * from "./create";
export * from "./fields";
export * from "./images";
export * from "./inspection";

export const listingSchema: z.ZodType<Listing> = z.object({
  id: trimmedRequiredString,
  slug: trimmedRequiredString,
  sellerId: trimmedRequiredString,
  title: trimmedRequiredString,
  category: z.enum(vehicleCategories),
  brand: trimmedRequiredString,
  model: trimmedRequiredString,
  carTrim: z.string().trim().optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(minimumCarYear, invalidMessage)
    .max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema,
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString,
  whatsappPhone: lenientPhoneSchema,
  vin: z.string().trim().length(17).optional().nullable(),
  licensePlate: z.string().trim().min(5).max(12).nullable().optional(),
  tramerAmount: z.coerce.number().int().min(0).nullable().optional(),
  // ── SECURITY FIX: Issue #7 - Damage Status Enum Validation ─────────────
  // Restrict damage status values to valid enums at schema level
  damageStatusJson: z.preprocess(
    (val) => {
      if (typeof val === "object" && val !== null) {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, v === "orjinal" ? "orijinal" : v])
        );
      }
      return val;
    },
    z
      .record(
        z.string(),
        z.enum([
          "orijinal",
          "boyali",
          "lokal_boyali",
          "degisen",
          "hasarli",
          "belirtilmemis",
          "bilinmiyor",
        ])
      )
      .nullable()
      .optional()
  ),
  fraudScore: z.coerce.number().int().min(0).max(100).optional(),
  fraudReason: z.string().nullable().optional(),
  viewCount: z.coerce.number().int().min(0).optional().default(0),
  version: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(listingStatuses),
  images: z.array(listingImageSchema),
  featured: z.boolean(),
  featuredUntil: z.string().nullable().optional(),
  urgentUntil: z.string().nullable().optional(),
  highlightedUntil: z.string().nullable().optional(),
  marketPriceIndex: z.coerce.number().nullable().optional(),
  expertInspection: expertInspectionSchema.optional(),
  seller: profileSchema.partial().optional(),
  bumpedAt: timestampSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const favoriteSchema: z.ZodType<{
  id?: string;
  userId: string;
  listingId: string;
  createdAt: string;
}> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  listingId: trimmedRequiredString,
  createdAt: timestampSchema,
});
