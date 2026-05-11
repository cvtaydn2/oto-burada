import { z } from "zod";

import { listingRejectReasonCodes, maximumNoteLength } from "@/lib/constants/domain";
import type { AdminModerationAction, ListingModerationRejectReason } from "@/types";

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

const listingRejectReasonCodeEnum = z.enum(listingRejectReasonCodes);

const moderatorNoteSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .min(3, "Not en az 3 karakter olmalı")
    .max(maximumNoteLength, "Not en fazla " + maximumNoteLength + " karakter olabilir")
    .nullable()
    .optional()
);

export const listingModerationRejectReasonSchema: z.ZodType<ListingModerationRejectReason> =
  z.object({
    reasonCode: listingRejectReasonCodeEnum,
    moderatorNote: moderatorNoteSchema,
  });

export const listingModerationDecisionSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    rejectReason: listingModerationRejectReasonSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "reject" && !value.rejectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectReason"],
        message: "Ret kararı için reason code seçmelisiniz.",
      });
    }
  });

export const bulkListingModerationSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    listingIds: z.array(z.string().uuid("Geçersiz ilan ID formatı")).min(1).max(50),
    rejectReason: listingModerationRejectReasonSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "reject" && !value.rejectReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectReason"],
        message: "Toplu ret için reason code seçmelisiniz.",
      });
    }
  });

export const uuidSchema = z.string().uuid("Geçersiz UUID formatı");

export const adminModerationActionSchema: z.ZodType<AdminModerationAction> = z.object({
  id: optionalTrimmedString,
  adminUserId: trimmedRequiredString,
  targetType: moderationTargetTypeEnum,
  targetId: trimmedRequiredString,
  action: moderationActionEnum,
  reasonCode: listingRejectReasonCodeEnum.nullish(),
  note: moderatorNoteSchema,
  createdAt: timestampSchema,
});

export const bulkListingActionSchema = z.object({
  ids: z
    .array(z.string().uuid("Geçersiz ilan ID formatı"))
    .min(1, "En az bir ilan seçmelisiniz.")
    .max(20, "En fazla 20 ilan işlenebilir."),
});

export type BulkListingActionInput = z.infer<typeof bulkListingActionSchema>;
