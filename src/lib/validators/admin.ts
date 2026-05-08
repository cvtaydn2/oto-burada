import { z } from "zod";

import { maximumNoteLength } from "@/lib/constants/domain";
import type { AdminModerationAction } from "@/types";

import {
  emptyStringToUndefined,
  optionalTrimmedString,
  timestampSchema,
  trimmedRequiredString,
} from "./shared";

const moderationTargetTypeEnum = z.enum(["listing", "report", "user"]);
const moderationActionEnum = z.enum([
  "approve",
  "reject",
  "archive",
  "review",
  "resolve",
  "dismiss",
  "edit",
  "ban",
  "unban",
  "promote",
  "demote",
  "delete_user",
  "credit_grant",
  "doping_grant",
]);

export const uuidSchema = z.string().uuid("Ge�ersiz UUID format�");

export const adminModerationActionSchema: z.ZodType<AdminModerationAction> = z.object({
  id: optionalTrimmedString,
  adminUserId: trimmedRequiredString,
  targetType: moderationTargetTypeEnum,
  targetId: trimmedRequiredString,
  action: moderationActionEnum,
  note: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .min(3, "Not en az 3 karakter olmal�")
      .max(maximumNoteLength, "Not en fazla " + maximumNoteLength + " karakter olabilir")
      .nullable()
      .optional()
  ),
  createdAt: timestampSchema,
});

export const bulkListingActionSchema = z.object({
  ids: z
    .array(z.string().uuid("Ge�ersiz ilan ID format�"))
    .min(1, "En az bir ilan se�melisiniz.")
    .max(20, "En fazla 20 ilan i�lenebilir."),
});

export type BulkListingActionInput = z.infer<typeof bulkListingActionSchema>;
