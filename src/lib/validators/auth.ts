import { z } from "zod";

import {
  emptyStringToUndefined,
  invalidMessage,
  lenientPhoneSchema,
  optionalTrimmedString,
  timestampSchema,
  trimmedRequiredString,
} from "./shared";

const userRoleEnum = z.enum(["user", "admin"]);

export const profileSchema = z.object({
  id: trimmedRequiredString,
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  emailVerified: z.boolean(),
  isVerified: z.boolean(),
  isBanned: z.boolean().optional(),
  banReason: z.string().nullable().optional(),
  identityNumber: z.string().trim().length(11).nullable().optional(),
  restrictionState: z.enum(["active", "restricted_review", "banned"]).optional(),
  trustScore: z.number().optional(),
  isWalletVerified: z.boolean().optional(),
  userType: z.enum(["individual", "professional", "staff"]).optional(),
  balanceCredits: z.number().int().min(0).optional(),
  role: userRoleEnum,

  // Corporate Fields
  businessName: z.string().trim().nullable().optional(),
  businessAddress: z.string().trim().nullable().optional(),
  businessLogoUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  businessDescription: z.string().trim().nullable().optional(),
  taxId: z.string().trim().nullable().optional(),
  taxOffice: z.string().trim().nullable().optional(),
  websiteUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  verifiedBusiness: z.boolean().optional(),
  businessSlug: z.string().trim().nullable().optional(),

  // Verification Workflow
  verificationStatus: z.enum(["none", "pending", "approved", "rejected"]).optional(),
  verificationRequestedAt: z.string().nullable().optional(),
  verificationReviewedAt: z.string().nullable().optional(),
  verificationFeedback: z.string().nullable().optional(),

  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const profileUpdateSchema = z.object({
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).nullable().optional()
  ),
  identityNumber: z.string().trim().length(11).nullable().optional(),
});

export const corporateProfileSchema = z.object({
  businessName: trimmedRequiredString,
  businessSlug: trimmedRequiredString.regex(
    /^[a-z0-9-]+$/,
    "Slug sadece kucuk harf, rakam ve tire icerebilir"
  ),
  businessAddress: optionalTrimmedString,
  businessDescription: optionalTrimmedString,
  taxId: optionalTrimmedString,
  taxOffice: optionalTrimmedString,
  websiteUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).optional()
  ),
  businessLogoUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).optional()
  ),
});

const PASSWORD_MIN_LENGTH = 8;

function strongPassword(value: string): boolean {
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır`)
  .refine(strongPassword, {
    message: "Şifre en az 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir",
  });

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  // Login akışında mevcut hesapların legacy şifreleri de kabul edilmelidir.
  // Güçlü şifre kuralı sadece kayıt/şifre sıfırlama aşamasında zorunlu olmalı.
  password: z.string().min(1, "Şifre gereklidir"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
    fullName: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: passwordSchema,
  })
  .refine((data) => data.password === data.confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
