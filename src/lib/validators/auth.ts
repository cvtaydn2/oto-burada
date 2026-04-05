import { z } from "zod";

const emailMessage = "Geçerli bir e-posta adresi gir";
const passwordMessage = "Şifre en az 6 karakter olmalı";

export const loginSchema = z.object({
  email: z.string().trim().email(emailMessage),
  password: z.string().min(6, passwordMessage),
});

export const registerSchema = loginSchema;
