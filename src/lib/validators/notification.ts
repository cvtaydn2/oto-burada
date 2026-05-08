import { z } from "zod";

import type { Notification, SavedSearch, SavedSearchCreateInput } from "@/types";

import { listingFiltersSchema } from "./marketplace";
import {
  emptyStringToUndefined,
  optionalTrimmedString,
  requiredMessage,
  timestampSchema,
  trimmedRequiredString,
} from "./shared";

const notificationTypeEnum = z.enum(["favorite", "moderation", "report", "system", "question"]);

export const notificationSchema: z.ZodType<Notification> = z.object({
  id: trimmedRequiredString,
  userId: trimmedRequiredString,
  type: notificationTypeEnum,
  title: trimmedRequiredString.max(160, "Baslik en fazla 160 karakter olabilir"),
  message: trimmedRequiredString.max(1000, "Mesaj en fazla 1000 karakter olabilir"),
  href: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, requiredMessage).nullable().optional()
  ),
  read: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const savedSearchSchema: z.ZodType<SavedSearch> = z.object({
  id: optionalTrimmedString,
  userId: trimmedRequiredString,
  title: trimmedRequiredString.max(120, "Baslik en fazla 120 karakter olabilir"),
  filters: listingFiltersSchema,
  notificationsEnabled: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const savedSearchCreateSchema: z.ZodType<SavedSearchCreateInput> = z.object({
  title: z
    .preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .min(1, requiredMessage)
        .max(120, "Baslik en fazla 120 karakter olabilir")
        .optional()
    )
    .optional(),
  filters: listingFiltersSchema,
  notificationsEnabled: z.boolean().optional(),
});

export const savedSearchUpdateSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    title: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .min(1, requiredMessage)
        .max(120, "Baslik en fazla 120 karakter olabilir")
        .optional()
    ),
  })
  .refine((value) => value.notificationsEnabled !== undefined || value.title !== undefined, {
    message: "Guncellenecek en az bir alan gondermelisin.",
  });
