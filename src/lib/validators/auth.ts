import { z } from "zod";
import { userRoles } from "@/lib/constants/domain";
import { 
  trimmedRequiredString, 
  lenientPhoneSchema, 
  invalidMessage, 
  timestampSchema, 
  emptyStringToUndefined,
  optionalTrimmedString
} from "./shared";

export const profileSchema = z.object({
  id: trimmedRequiredString,
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.string().trim().url(invalidMessage).nullable().optional(),
  emailVerified: z.boolean(),
  isVerified: z.boolean(),
  isBanned: z.boolean().optional(),
  userType: z.enum(["individual", "professional", "staff"]).optional(),
  balanceCredits: z.number().int().min(0).optional(),
  role: z.enum(userRoles),
  
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

  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const profileUpdateSchema = z.object({
  fullName: trimmedRequiredString,
  phone: lenientPhoneSchema,
  city: trimmedRequiredString,
  avatarUrl: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().url(invalidMessage).nullable().optional(),
  ),
});

export const corporateProfileSchema = z.object({
  businessName: trimmedRequiredString,
  businessSlug: trimmedRequiredString.regex(/^[a-z0-9-]+$/, "Slug sadece kucuk harf, rakam ve tire icerebilir"),
  businessAddress: optionalTrimmedString,
  businessDescription: optionalTrimmedString,
  taxId: optionalTrimmedString,
  taxOffice: optionalTrimmedString,
  websiteUrl: z.preprocess(emptyStringToUndefined, z.string().trim().url(invalidMessage).optional()),
  businessLogoUrl: z.preprocess(emptyStringToUndefined, z.string().trim().url(invalidMessage).optional()),
});

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
  fullName: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
