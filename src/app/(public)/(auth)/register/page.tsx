import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/auth-form";
import { registerAction } from "@/features/auth/lib/actions";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Kayıt Ol | OtoBurada",
  description:
    "Ücretsiz hesap oluşturun, birkaç adımda araç ilanınızı yayınlayın ve alıcılarla hızlıca iletişime geçin.",
  alternates: {
    canonical: buildAbsoluteUrl("/register"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AuthForm
        action={registerAction}
        submitLabel="Hesap Oluştur"
        alternateHref="/login"
        alternateLabel="Giriş Yap"
        mode="register"
      />
    </div>
  );
}
