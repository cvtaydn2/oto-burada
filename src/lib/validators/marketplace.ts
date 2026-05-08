import { z } from "zod";

import { maximumCarYear, maximumMileage, minimumCarYear } from "@/lib/domain";
import { vehicleCategories } from "@/lib/vehicle-categories";
import type { ListingFilters } from "@/types";

import {
  emptyStringToUndefined,
  invalidMessage,
  nonNegativeNumberSchema,
  optionalTrimmedString,
} from "./shared";

const fuelTypeEnum = z.enum(["benzin", "dizel", "lpg", "hibrit", "elektrik"]);
const transmissionTypeEnum = z.enum(["manuel", "otomatik", "yari_otomatik"]);
const listingSortOptionEnum = z.enum([
  "newest",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "mileage_desc",
  "year_desc",
  "year_asc",
  "oldest",
]);

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
    category: z.preprocess(emptyStringToUndefined, z.enum(vehicleCategories).optional()).optional(),
    minPrice: z
      .preprocess(
        emptyStringToUndefined,
        z.coerce.number().finite().min(0, invalidMessage).optional()
      )
      .optional(),
    maxPrice: z
      .preprocess(
        emptyStringToUndefined,
        z.coerce.number().finite().min(0, invalidMessage).optional()
      )
      .optional(),
    minYear: z
      .preprocess(
        emptyStringToUndefined,
        z.coerce
          .number()
          .int()
          .min(minimumCarYear, invalidMessage)
          .max(maximumCarYear, invalidMessage)
          .optional()
      )
      .optional(),
    maxYear: z
      .preprocess(
        emptyStringToUndefined,
        z.coerce
          .number()
          .int()
          .min(minimumCarYear, invalidMessage)
          .max(maximumCarYear, invalidMessage)
          .optional()
      )
      .optional(),
    maxMileage: z
      .preprocess(
        emptyStringToUndefined,
        nonNegativeNumberSchema.max(maximumMileage, invalidMessage).optional()
      )
      .optional(),
    maxTramer: z.preprocess(emptyStringToUndefined, nonNegativeNumberSchema.optional()).optional(),
    hasExpertReport: z
      .preprocess(
        (value) =>
          value === "true" || value === true
            ? true
            : value === "false" || value === false
              ? false
              : undefined,
        z.boolean().optional()
      )
      .optional(),
    fuelType: z.preprocess(emptyStringToUndefined, fuelTypeEnum.optional()).optional(),
    transmission: z.preprocess(emptyStringToUndefined, transmissionTypeEnum.optional()).optional(),
    sort: z.preprocess(emptyStringToUndefined, listingSortOptionEnum.optional()).optional(),
    page: z
      .preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).optional())
      .optional(),
    limit: z
      .preprocess(emptyStringToUndefined, z.coerce.number().int().min(1).max(100).optional())
      .optional(),
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
