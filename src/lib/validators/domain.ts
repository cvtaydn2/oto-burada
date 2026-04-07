import { z } from "zod";

import {
  fuelTypes,
  listingSortOptions,
  listingStatuses,
  maximumCarYear,
  maximumMileage,
  minimumCarYear,
  minimumListingImages,
  moderationActions,
  moderationTargetTypes,
  reportReasons,
  reportStatuses,
  transmissionTypes,
  userRoles,
} from "@/lib/constants/domain";
import type {
  AdminModerationAction,
  Favorite,
  Listing,
  ListingCreateInput,
  ListingFilters,
  ListingImage,
  Profile,
  Report,
  ReportCreateInput,
} from "@/types";

const requiredMessage = "Bu alan zorunlu";
const invalidMessage = "Geçerli bir değer gir";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const trimmedRequiredString = z.string().trim().min(1, requiredMessage);

const optionalTrimmedString = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().min(1, requiredMessage).optional(),
);

const positiveCurrencySchema = z.coerce.number().finite().min(1, invalidMessage);
const nonNegativeNumberSchema = z.coerce.number().finite().min(0, invalidMessage);

const timestampSchema = z.string().trim().min(1, "Geçerli bir tarih gir");

const lenientPhoneSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || /^\+?[0-9\s]{10,15}$/.test(val), {
    message: "Geçerli bir telefon numarası gir",
  });

export const profileSchema: z.ZodType<Profile> = z.object({
  id: trimmedRequiredString,
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  role: z.enum(userRoles),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const profileUpdateSchema = z.object({
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).nullable().optional(),
  ),
});

export const listingImageSchema: z.ZodType<ListingImage> = z.object({
  id: optionalTrimmedString,
  listingId: z
    .preprocess(emptyStringToUndefined, z.string().trim().min(1, requiredMessage).nullable().optional()),
  storagePath: trimmedRequiredString,
  url: z.string().trim().url(invalidMessage),
  order: z.coerce.number().int().min(0, invalidMessage),
  isCover: z.boolean(),
});

export const listingCreateSchema: z.ZodType<ListingCreateInput> = z.object({
  title: trimmedRequiredString,
  brand: trimmedRequiredString,
  model: trimmedRequiredString,
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema,
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString.min(20, "Açıklama en az 20 karakter olmalı"),
  whatsappPhone: lenientPhoneSchema,
  images: z
    .array(listingImageSchema)
    .min(minimumListingImages, "En az 3 fotoğraf eklemelisin"),
});

export const listingCreateFormSchema = z.object({
  title: trimmedRequiredString,
  brand: trimmedRequiredString,
  model: trimmedRequiredString,
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema,
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString.min(20, "Açıklama en az 20 karakter olmalı"),
  whatsappPhone: lenientPhoneSchema,
  images: z
    .array(
      z.object({
        fileName: z.string().trim().optional(),
        mimeType: z.string().trim().optional(),
        size: z.coerce.number().int().min(0).optional(),
        storagePath: z.string().trim().optional(),
        url: z.string().trim().optional(),
      }),
    )
    .superRefine((images, context) => {
      const populatedImages = images.filter(
        (image) =>
          image.url &&
          image.url.trim().length > 0 &&
          image.storagePath &&
          image.storagePath.trim().length > 0,
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

        const parsedUrl = z.string().trim().url("Geçerli bir fotoğraf bağlantısı gir").safeParse(image.url);

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
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema,
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString,
  whatsappPhone: lenientPhoneSchema,
  status: z.enum(listingStatuses),
  images: z.array(listingImageSchema),
  featured: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const favoriteSchema: z.ZodType<Favorite> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  listingId: trimmedRequiredString,
  createdAt: timestampSchema,
});

export const reportSchema: z.ZodType<Report> = z.object({
  id: optionalTrimmedString,
  listingId: trimmedRequiredString,
  reporterId: trimmedRequiredString,
  reason: z.enum(reportReasons),
  description: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(5, "Açıklama en az 5 karakter olmalı").nullable().optional(),
  ),
  status: z.enum(reportStatuses),
  createdAt: timestampSchema,
  updatedAt: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, "Geçerli bir tarih gir").nullable().optional(),
  ),
});

export const reportCreateSchema: z.ZodType<ReportCreateInput> = z.object({
  listingId: trimmedRequiredString,
  reason: z.enum(reportReasons),
  description: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(5, "Aciklama en az 5 karakter olmali").nullable().optional(),
  ),
});

export const adminModerationActionSchema: z.ZodType<AdminModerationAction> = z.object({
  id: optionalTrimmedString,
  adminUserId: trimmedRequiredString,
  targetType: z.enum(moderationTargetTypes),
  targetId: trimmedRequiredString,
  action: z.enum(moderationActions),
  note: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(3, "Not en az 3 karakter olmalı").nullable().optional(),
  ),
  createdAt: timestampSchema,
});

export const listingFiltersSchema: z.ZodType<ListingFilters> = z
  .object({
    query: optionalTrimmedString,
    brand: optionalTrimmedString,
    model: optionalTrimmedString,
    city: optionalTrimmedString,
    district: optionalTrimmedString,
    minPrice: z.preprocess(emptyStringToUndefined, positiveCurrencySchema.optional()),
    maxPrice: z.preprocess(emptyStringToUndefined, positiveCurrencySchema.optional()),
    minYear: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage).optional(),
    ),
    maxYear: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage).optional(),
    ),
    maxMileage: z.preprocess(
      emptyStringToUndefined,
      nonNegativeNumberSchema.max(maximumMileage, invalidMessage).optional(),
    ),
    fuelType: z.preprocess(emptyStringToUndefined, z.enum(fuelTypes).optional()),
    transmission: z.preprocess(emptyStringToUndefined, z.enum(transmissionTypes).optional()),
    sort: z.preprocess(emptyStringToUndefined, z.enum(listingSortOptions).optional()),
    page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).optional()),
    limit: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(100).optional()),
  })
  .refine(
    (values) =>
      values.minPrice === undefined ||
      values.maxPrice === undefined ||
      values.minPrice <= values.maxPrice,
    {
      message: "Minimum fiyat maksimum fiyattan büyük olamaz",
      path: ["minPrice"],
    },
  )
  .refine(
    (values) =>
      values.minYear === undefined ||
      values.maxYear === undefined ||
      values.minYear <= values.maxYear,
    {
      message: "Minimum yıl maksimum yıldan büyük olamaz",
      path: ["minYear"],
    },
  );
