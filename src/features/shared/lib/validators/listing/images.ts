import { z } from "zod";

import type { ListingImage } from "@/types";

import {
  emptyStringToUndefined,
  invalidMessage,
  optionalTrimmedString,
  requiredMessage,
  trimmedRequiredString,
} from "../shared";

export const listingImageSchema: z.ZodType<ListingImage> = z.object({
  id: optionalTrimmedString,
  listingId: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, requiredMessage).nullable().optional()
    )
    .optional(),
  storagePath: trimmedRequiredString,
  url: z.string().trim().url(invalidMessage),
  order: z.coerce.number().int().min(0, invalidMessage),
  isCover: z.boolean(),
  placeholderBlur: z.string().trim().nullable().optional(),
});
