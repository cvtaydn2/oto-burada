import { z } from "zod";

const emailMessage = "Geçerli bir e-posta adresi gir";
const passwordMessage = "Şifre en az 8 karakter olmalı";

export const loginSchema = z.object({
  email: z.string().trim().email(emailMessage),
  // Login allows any password length (user may have an old shorter password)
  // but we validate min 6 to avoid empty string submissions
  password: z.string().min(6, "Şifre gerekli"),
});

// Register enforces the stronger password requirement
export const registerSchema = z.object({
  email: z.string().trim().email(emailMessage),
  password: z.string().min(8, passwordMessage),
});
