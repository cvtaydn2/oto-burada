import { z } from "zod";

export const requiredMessage = "Bu alan zorunlu";
export const invalidMessage = "Geçerli bir değer gir";

export const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }
  return value;
};

export const trimmedRequiredString = z.string().trim().min(1, requiredMessage);

export const optionalTrimmedString = z
  .preprocess(emptyStringToUndefined, z.string().trim().min(1, requiredMessage).optional())
  .optional();

export const positiveCurrencySchema = z.coerce.number().finite().min(1, invalidMessage);
export const nonNegativeNumberSchema = z.coerce.number().finite().min(0, invalidMessage);

export const timestampSchema = z.string().trim().min(1, "Geçerli bir tarih gir");

export const lenientPhoneSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (val === "") return true;
      const digitsOnly = val.replace(/\D/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 13;
    },
    { message: "Geçerli bir telefon numarası gir" }
  );
