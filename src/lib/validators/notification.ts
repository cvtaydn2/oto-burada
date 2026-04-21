import { z } from "zod";
import type { 
  Notification, 
  SavedSearch, 
  SavedSearchCreateInput 
} from "@/types";
import { notificationTypes } from "@/lib/constants/domain";
import { 
  optionalTrimmedString, 
  trimmedRequiredString, 
  timestampSchema, 
  emptyStringToUndefined,
  requiredMessage
} from "./shared";
import { listingFiltersSchema } from "./marketplace";

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
  title: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(1, requiredMessage).max(120, "Baslik en fazla 120 karakter olabilir").optional(),
  ),
  filters: listingFiltersSchema,
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
