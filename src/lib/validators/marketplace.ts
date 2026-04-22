import { z } from "zod";

import {
  fuelTypes,
  listingSortOptions,
  maximumCarYear,
  maximumMileage,
  minimumCarYear,
  transmissionTypes,
} from "@/lib/constants/domain";
import type { ListingFilters } from "@/types";

import {
  emptyStringToUndefined,
  invalidMessage,
  nonNegativeNumberSchema,
  optionalTrimmedString,
} from "./shared";

const vehicleCategories = ["otomobil", "suv", "minivan", "ticari", "motosiklet"] as const;

export const listingFilterRecoveryFieldNames = [
  "query",
  "brand",
  "model",
  "carTrim",
  "city",
  "district",
  "category",
  "fuelType",
  "transmission",
  "sort",
  "page",
  "limit",
  "hasExpertReport",
  "citySlug",
  "sellerId",
  "cursor",
] as const;

export const listingFilterRecoveryNumericFieldNames = [
  "minPrice",
  "maxPrice",
  "minYear",
  "maxYear",
  "maxMileage",
  "maxTramer",
] as const;

export const listingFiltersSchema: z.ZodType<ListingFilters> = z
  .object({
    query: optionalTrimmedString,
    brand: optionalTrimmedString,
    model: optionalTrimmedString,
    carTrim: optionalTrimmedString,
    city: optionalTrimmedString,
    district: optionalTrimmedString,
    category: z.preprocess(emptyStringToUndefined, z.enum(vehicleCategories).optional()),
    minPrice: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().finite().min(0, invalidMessage).optional()
    ),
    maxPrice: z.preprocess(
      emptyStringToUndefined,
      z.coerce.number().finite().min(0, invalidMessage).optional()
    ),
    minYear: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number()
        .int()
        .min(minimumCarYear, invalidMessage)
        .max(maximumCarYear, invalidMessage)
        .optional()
    ),
    maxYear: z.preprocess(
      emptyStringToUndefined,
      z.coerce
        .number()
        .int()
        .min(minimumCarYear, invalidMessage)
        .max(maximumCarYear, invalidMessage)
        .optional()
    ),
    maxMileage: z.preprocess(
      emptyStringToUndefined,
      nonNegativeNumberSchema.max(maximumMileage, invalidMessage).optional()
    ),
    maxTramer: z.preprocess(emptyStringToUndefined, nonNegativeNumberSchema.optional()),
    hasExpertReport: z.preprocess(
      (value) =>
        value === "true" || value === true
          ? true
          : value === "false" || value === false
            ? false
            : undefined,
      z.boolean().optional()
    ),
    fuelType: z.preprocess(emptyStringToUndefined, z.enum(fuelTypes).optional()),
    transmission: z.preprocess(emptyStringToUndefined, z.enum(transmissionTypes).optional()),
    sort: z.preprocess(emptyStringToUndefined, z.enum(listingSortOptions).optional()),
    page: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).optional()),
    limit: z.preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(100).optional()),
    citySlug: optionalTrimmedString,
    sellerId: optionalTrimmedString,
    cursor: optionalTrimmedString,
  })
  .refine(
    (values) =>
      values.minPrice === undefined ||
      values.maxPrice === undefined ||
      values.minPrice <= values.maxPrice,
    {
      message: "Minimum fiyat maksimum fiyattan büyük olamaz",
      path: ["minPrice"],
    }
  )
  .refine(
    (values) =>
      values.minYear === undefined ||
      values.maxYear === undefined ||
      values.minYear <= values.maxYear,
    {
      message: "Minimum yıl maksimum yıldan büyük olamaz",
      path: ["minYear"],
    }
  );
