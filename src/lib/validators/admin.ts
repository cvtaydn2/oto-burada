import { z } from "zod";
import type { AdminModerationAction } from "@/types";
import { 
  moderationTargetTypes, 
  moderationActions, 
  maximumNoteLength 
} from "@/lib/constants/domain";
import { 
  optionalTrimmedString, 
  trimmedRequiredString, 
  emptyStringToUndefined, 
  timestampSchema 
} from "./shared";

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

export const bulkListingActionSchema = z.object({
  ids: z
    .array(z.string().uuid("Geçersiz ilan ID formatı"))
    .min(1, "En az bir ilan seçmelisiniz.")
    .max(20, "Bir seferde en fazla 20 ilan işlenebilir."),
});

export type BulkListingActionInput = z.infer<typeof bulkListingActionSchema>;
