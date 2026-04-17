import { z } from "zod";
import type { ListingCreateFormValues } from "@/types";

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
  notificationTypes,
  transmissionTypes,
  userRoles,
  maximumListingPrice,
  maximumDescriptionLength,
  maximumNoteLength,
  expertInspectionGrades,
  expertInspectionStatuses,
} from "@/lib/constants/domain";
import type {
  AdminModerationAction,
  ExpertInspection,
  Favorite,
  Listing,
  ListingCreateInput,
  ListingFilters,
  ListingImage,
  Report,
  ReportCreateInput,
  Notification,
  SavedSearch,
  SavedSearchCreateInput,
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

export const profileSchema = z.object({
  id: trimmedRequiredString,
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  emailVerified: z.boolean(),
  isVerified: z.boolean(),
  isBanned: z.boolean().optional(),
  userType: z.enum(["individual", "professional", "staff"]).optional(),
  balanceCredits: z.number().int().min(0).optional(),
  role: z.enum(userRoles),
  
  // Corporate Fields
  businessName: z.string().trim().nullable().optional(),
  businessAddress: z.string().trim().nullable().optional(),
  businessLogoUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  businessDescription: z.string().trim().nullable().optional(),
  taxId: z.string().trim().nullable().optional(),
  taxOffice: z.string().trim().nullable().optional(),
  websiteUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  verifiedBusiness: z.boolean().optional(),
  businessSlug: z.string().trim().nullable().optional(),

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

export const corporateProfileSchema = z.object({
  businessName: trimmedRequiredString,
  businessSlug: trimmedRequiredString.regex(/^[a-z0-9-]+$/, "Slug sadece kucuk harf, rakam ve tire icerebilir"),
  businessAddress: optionalTrimmedString,
  businessDescription: optionalTrimmedString,
  taxId: optionalTrimmedString,
  taxOffice: optionalTrimmedString,
  websiteUrl: z.preprocess(emptyStringToUndefined, z.string().trim().url(invalidMessage).optional()),
  businessLogoUrl: z.preprocess(emptyStringToUndefined, z.string().trim().url(invalidMessage).optional()),
});

export const listingImageSchema: z.ZodType<ListingImage> = z.object({
  id: optionalTrimmedString,
  listingId: z
    .preprocess(emptyStringToUndefined, z.string().trim().min(1, requiredMessage).nullable().optional()),
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
  documentUrl: z.preprocess(emptyStringToUndefined, z.string().trim().url(invalidMessage).optional()),
  documentPath: optionalTrimmedString,
});

export const listingCreateSchema: z.ZodType<ListingCreateInput> = z.object({
  title: trimmedRequiredString.max(200, "Baslik en fazla 200 karakter olabilir"),
  brand: trimmedRequiredString,
  model: trimmedRequiredString,
  carTrim: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema.max(maximumListingPrice, `Fiyat en fazla ${maximumListingPrice.toLocaleString("tr-TR")} TL olabilir`),
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString
    .min(20, "Açıklama en az 20 karakter olmalı")
    .max(maximumDescriptionLength, `Açıklama en fazla ${maximumDescriptionLength} karakter olabilir`),
  whatsappPhone: lenientPhoneSchema,
  vin: z
    .string()
    .trim()
    .length(17, "Şasi numarası (VIN) tam olarak 17 karakter olmalıdır")
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Geçersiz şasi numarası formatı (I, O, Q harfleri içermez)"),
  licensePlate: z.string().trim().min(5, "Geçerli bir plaka gir").max(12, "Gecersiz plaka").nullable().optional(),
  tramerAmount: nonNegativeNumberSchema.nullable().optional(),
  damageStatusJson: z.record(z.string(), z.string()).nullable().optional(),
  images: z
    .array(listingImageSchema)
    .min(minimumListingImages, "En az 3 fotoğraf eklemelisin"),
  expertInspection: expertInspectionSchema.optional(),
});

export const listingCreateFormSchema: z.ZodType<ListingCreateFormValues> = z.object({
  title: trimmedRequiredString.max(200, "Baslik en fazla 200 karakter olabilir"),
  brand: trimmedRequiredString,
  model: trimmedRequiredString,
  carTrim: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
  mileage: nonNegativeNumberSchema.max(maximumMileage, invalidMessage),
  fuelType: z.enum(fuelTypes),
  transmission: z.enum(transmissionTypes),
  price: positiveCurrencySchema.max(maximumListingPrice, `Fiyat en fazla ${maximumListingPrice.toLocaleString("tr-TR")} TL olabilir`),
  city: trimmedRequiredString,
  district: trimmedRequiredString,
  description: trimmedRequiredString
    .min(20, "Açıklama en az 20 karakter olmalı")
    .max(maximumDescriptionLength, `Açıklama en fazla ${maximumDescriptionLength} karakter olabilir`),
  whatsappPhone: lenientPhoneSchema,
  vin: z
    .string()
    .trim()
    .length(17, "Şasi numarası (VIN) tam olarak 17 karakter olmalıdır")
    .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Geçersiz şasi numarası formatı (I, O, Q harfleri içermez)"),
  licensePlate: z.string().trim().min(5, "Geçerli bir plaka gir").max(12, "Gecersiz plaka").nullable().optional(),
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
  carTrim: z.string().trim().optional().nullable(),
  year: z.coerce.number().int().min(minimumCarYear, invalidMessage).max(maximumCarYear, invalidMessage),
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

export const favoriteSchema: z.ZodType<Favorite> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  listingId: trimmedRequiredString,
  createdAt: timestampSchema,
});

export const savedSearchSchema: z.ZodType<SavedSearch> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  title: trimmedRequiredString.max(120, "Baslik en fazla 120 karakter olabilir"),
  filters: z.lazy(() => listingFiltersSchema),
  notificationsEnabled: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const savedSearchCreateSchema: z.ZodType<SavedSearchCreateInput> = z.object({
  title: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, requiredMessage).max(120, "Baslik en fazla 120 karakter olabilir").optional(),
  ),
  filters: z.lazy(() => listingFiltersSchema),
  notificationsEnabled: z.boolean().optional(),
});

export const savedSearchUpdateSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    title: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, requiredMessage).max(120, "Baslik en fazla 120 karakter olabilir").optional(),
    ),
  })
  .refine(
    (value) => value.notificationsEnabled !== undefined || value.title !== undefined,
    {
      message: "Guncellenecek en az bir alan gondermelisin.",
    },
  );

export const notificationSchema: z.ZodType<Notification> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  type: z.enum(notificationTypes),
  title: trimmedRequiredString.max(160, "Baslik en fazla 160 karakter olabilir"),
  message: trimmedRequiredString.max(1000, "Mesaj en fazla 1000 karakter olabilir"),
  href: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, requiredMessage).nullable().optional(),
  ),
  read: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
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
    z
      .string()
      .trim()
      .min(3, "Not en az 3 karakter olmalı")
      .max(maximumNoteLength, `Not en fazla ${maximumNoteLength} karakter olabilir`)
      .nullable()
      .optional(),
  ),
  createdAt: timestampSchema,
});

export const listingFiltersSchema: z.ZodType<ListingFilters> = z
  .object({
    query: optionalTrimmedString,
    brand: optionalTrimmedString,
    model: optionalTrimmedString,
    carTrim: optionalTrimmedString,
    city: optionalTrimmedString,
    district: optionalTrimmedString,
    minPrice: z.preprocess(emptyStringToUndefined, z.coerce.number().finite().min(0, invalidMessage).optional()),
    maxPrice: z.preprocess(emptyStringToUndefined, z.coerce.number().finite().min(0, invalidMessage).optional()),
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
    maxTramer: z.preprocess(
      emptyStringToUndefined,
      nonNegativeNumberSchema.optional(),
    ),
    hasExpertReport: z.preprocess(
      (value) => value === "true" || value === true ? true : value === "false" || value === false ? false : undefined,
      z.boolean().optional(),
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
