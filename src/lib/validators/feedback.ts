import { z } from "zod";

import type { Report, ReportCreateInput } from "@/types";

import {
  emptyStringToUndefined,
  optionalTrimmedString,
  timestampSchema,
  trimmedRequiredString,
} from "./shared";

export const reportReasonEnum = z.enum([
  "fake_listing",
  "wrong_info",
  "spam",
  "price_manipulation",
  "invalid_verification",
  "other",
]);

export const reportStatusEnum = z.enum(["open", "reviewing", "resolved", "dismissed"]);

export const reportSchema: z.ZodType<Report> = z.object({
  id: optionalTrimmedString,
  listingId: trimmedRequiredString,
  reporterId: trimmedRequiredString,
  reason: reportReasonEnum,
  description: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(5, "Açıklama en az 5 karakter olmalı").nullable().optional()
    )
    .optional(),
  status: reportStatusEnum,
  createdAt: timestampSchema,
  updatedAt: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(1, "Geçerli bir tarih gir").nullable().optional()
    )
    .optional(),
});

export const reportCreateSchema: z.ZodType<ReportCreateInput> = z.object({
  listingId: trimmedRequiredString,
  reason: reportReasonEnum,
  description: z
    .preprocess(
      emptyStringToUndefined,
      z.string().trim().min(5, "Aciklama en az 5 karakter olmali").nullable().optional()
    )
    .optional(),
});

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalıdır.")
    .max(100, "Ad soyad en fazla 100 karakter olabilir."),
  email: z
    .string()
    .trim()
    .email("Geçerli bir e-posta adresi gir.")
    .max(254, "E-posta adresi çok uzun."),
  subject: z.enum([
    "İlanımla ilgili sorun yaşıyorum",
    "Kurumsal üyelik hakkında bilgi",
    "Öneri / Şikayet",
    "Teknik destek",
    "Diğer",
  ]),
  message: z
    .string()
    .trim()
    .min(10, "Mesaj en az 10 karakter olmalıdır.")
    .max(2000, "Mesaj en fazla 2000 karakter olabilir."),
  _hp: z.string().max(0, "Bot detected").optional(),
  turnstileToken: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
