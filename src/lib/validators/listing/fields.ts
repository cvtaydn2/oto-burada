import { z } from "zod";

import {
  fuelTypes,
  maximumCarYear,
  maximumDescriptionLength,
  maximumListingPrice,
  maximumMileage,
  minimumCarYear,
  transmissionTypes,
} from "@/lib/constants/domain";
import { vehicleCategories } from "@/lib/constants/vehicle-categories";

import {
  invalidMessage,
  lenientPhoneSchema,
  nonNegativeNumberSchema,
  positiveCurrencySchema,
  trimmedRequiredString,
} from "../shared";

export const baseListingFields = {
  title: trimmedRequiredString.max(200, "Başlık en fazla 200 karakter olabilir"),
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
    .toUpperCase()
    .length(17, "Şasi numarası (VIN) tam olarak 17 karakter olmalıdır")
    .regex(/^[A-HJ-NPR-Z0-9]+$/, "Geçersiz şasi numarası formatı (I, O, Q harfleri içermez)"),
  licensePlate: z
    .string()
    .trim()
    .min(5, "Geçerli bir plaka gir")
    .max(12, "Geçersiz plaka")
    .nullable()
    .optional(),
  tramerAmount: nonNegativeNumberSchema.nullable().optional(),
  damageStatusJson: z.record(z.string(), z.string()).nullable().optional(),
};
