import { z } from "zod";

import {
  expertInspectionGrades,
  expertInspectionStatuses,
  fuelTypes,
  listingStatuses,
  maximumCarYear,
  maximumDescriptionLength,
  maximumListingPrice,
  maximumMileage,
  minimumCarYear,
  minimumListingImages,
  transmissionTypes,
} from "@/lib/constants/domain";
import type { ExpertInspection, Listing, ListingCreateInput, ListingImage } from "@/types";
import type { ListingCreateFormValues } from "@/types";

import { profileSchema } from "./auth";
import {
  emptyStringToUndefined,
  invalidMessage,
  lenientPhoneSchema,
  nonNegativeNumberSchema,
  optionalTrimmedString,
  positiveCurrencySchema,
  requiredMessage,
  timestampSchema,
  trimmedRequiredString,
} from "./shared";

export const listingImageSchema: z.ZodType<ListingImage> = z.object({
  id: optionalTrimmedString,
  listingId: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, requiredMessage).nullable().optional()
  ),
  storagePath: trimmedRequiredString,
  url: z.string().trim().url(invalidMessage),
  order: z.coerce.number().int().min(0, invalidMessage),
  isCover: z.boolean(),
  placeholderBlur: z.string().trim().nullable().optional(),
});

export const expertInspectionSchema: z.ZodType<ExpertInspection> = z.object({
  hasInspection: z.boolean(),
  inspectionDate: optionalTrimmedString,
  overallGrade: z.enum(expertInspectionGrades).optional(),
  totalScore: z.coerce.number().int().min(0).max(100).optional(),
  damageRecord: z.enum(expertInspectionStatuses),
  bodyPaint: z.enum(expertInspectionStatuses),
  engine: z.enum(expertInspectionStatuses),
  transmission: z.enum(expertInspectionStatuses),
  suspension: z.enum(expertInspectionStatuses),
  brakes: z.enum(expertInspectionStatuses),
  electrical: z.enum(expertInspectionStatuses),
  interior: z.enum(expertInspectionStatuses),
  tires: z.enum(expertInspectionStatuses),
  acHeating: z.enum(expertInspectionStatuses),
  notes: optionalTrimmedString,
  inspectedBy: optionalTrimmedString,
  documentUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).optional()
  ),
  documentPath: optionalTrimmedString,
});

export const listingCreateSchema: z.ZodType<ListingCreateInput> = z.object({
  title: trimmedRequiredString.max(200, "Baslik en fazla 200 karakter olabilir"),
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
  price: positiveCurrencySchema.max(
    maximumListingPrice,
    `Fiyat en fazla ${maximumListingPrice.toLocaleString("tr-TR")} TL olabilir`
  ),
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString
    .min(20, "Açıklama en az 20 karakter olmalı")
    .max(
      maximumDescriptionLength,
      `Açıklama en fazla ${maximumDescriptionLength} karakter olabilir`
    ),
  whatsappPhone: lenientPhoneSchema,
  vin: z
    .string()
    .trim()
    .length(17, "Şasi numarası (VIN) tam olarak 17 karakter olmalıdır")
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Geçersiz şasi numarası formatı (I, O, Q harfleri içermez)"),
  licensePlate: z
    .string()
    .trim()
    .min(5, "Geçerli bir plaka gir")
    .max(12, "Gecersiz plaka")
    .nullable()
    .optional(),
  tramerAmount: nonNegativeNumberSchema.nullable().optional(),
  damageStatusJson: z.record(z.string(), z.string()).nullable().optional(),
  images: z.array(listingImageSchema).min(minimumListingImages, "En az 3 fotoğraf eklemelisin"),
  expertInspection: expertInspectionSchema.optional(),
});

export const listingCreateFormSchema: z.ZodType<ListingCreateFormValues> = z.object({
  title: trimmedRequiredString.max(200, "Baslik en fazla 200 karakter olabilir"),
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
  price: positiveCurrencySchema.max(
    maximumListingPrice,
    `Fiyat en fazla ${maximumListingPrice.toLocaleString("tr-TR")} TL olabilir`
  ),
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString
    .min(20, "Açıklama en az 20 karakter olmalı")
    .max(
      maximumDescriptionLength,
      `Açıklama en fazla ${maximumDescriptionLength} karakter olabilir`
    ),
  whatsappPhone: lenientPhoneSchema,
  vin: z
    .string()
    .trim()
    .length(17, "Şasi numarası (VIN) tam olarak 17 karakter olmalıdır")
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Geçersiz şasi numarası formatı (I, O, Q harfleri içermez)"),
  licensePlate: z
    .string()
    .trim()
    .min(5, "Geçerli bir plaka gir")
    .max(12, "Gecersiz plaka")
    .nullable()
    .optional(),
  tramerAmount: nonNegativeNumberSchema.nullable().optional(),
  damageStatusJson: z.record(z.string(), z.string()).nullable().optional(),
  expertInspection: expertInspectionSchema.optional(),
  images: z
    .array(
      z.object({
        fileName: z.string().trim().optional(),
        mimeType: z.string().trim().optional(),
        size: z.coerce.number().int().min(0).optional(),
        storagePath: z.string().trim().optional(),
        url: z.string().trim().optional(),
        placeholderBlur: z.string().trim().nullable().optional(),
        imageType: z.enum(["photo", "360"]).optional(),
      })
    )
    .superRefine((images, context) => {
      const populatedImages = images.filter(
        (image) =>
          image.url &&
          image.url.trim().length > 0 &&
          image.storagePath &&
          image.storagePath.trim().length > 0
      );

      if (populatedImages.length < minimumListingImages) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message: "En az 3 fotoğraf eklemelisin",
        });
      }

      images.forEach((image, index) => {
        const hasUrl = Boolean(image.url && image.url.trim().length > 0);
        const hasStoragePath = Boolean(image.storagePath && image.storagePath.trim().length > 0);

        if (!hasUrl && !hasStoragePath) {
          return;
        }

        if (!hasUrl || !hasStoragePath) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["images", index, "url"],
            message: "Fotografi once yuklemelisin",
          });
          return;
        }

        const parsedUrl = z
          .string()
          .trim()
          .url("Geçerli bir fotoğraf bağlantısı gir")
          .safeParse(image.url);

        if (!parsedUrl.success) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["images", index, "url"],
            message: "Geçerli bir fotoğraf bağlantısı gir",
          });
        }
      });
    }),
});

export const listingSchema: z.ZodType<Listing> = z.object({
  id: trimmedRequiredString,
  slug: trimmedRequiredString,
  sellerId: trimmedRequiredString,
  title: trimmedRequiredString,
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
  damageStatusJson: z.record(z.string(), z.string()).nullable().optional(),
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
