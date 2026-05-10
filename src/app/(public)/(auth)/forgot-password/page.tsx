import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Şifremi Unuttum | OtoBurada",
  description:
    "Şifre sıfırlama bağlantısı isteyerek OtoBurada hesabınıza güvenli şekilde yeniden erişin.",
  alternates: {
    canonical: buildAbsoluteUrl("/forgot-password"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ForgotPasswordForm />
    </div>
  );
}
