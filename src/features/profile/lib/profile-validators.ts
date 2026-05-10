import { z } from "zod";

import { invalidMessage, lenientPhoneSchema, trimmedRequiredString } from "@/lib/validators/shared";

export const profileUpdateInputSchema = z.object({
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.union([z.string().trim().url(invalidMessage), z.literal("")]),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateInputSchema>;

export const profileActionResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    message: z.string(),
    data: z.any().optional(),
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
]);

export type ProfileActionResult = z.infer<typeof profileActionResultSchema>;
