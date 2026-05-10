import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const metadata: Metadata = {
  title: "Şifre Yenile | OtoBurada",
  description: "Yeni şifrenizi belirleyerek OtoBurada hesabınızın güvenliğini güncelleyin.",
  alternates: {
    canonical: buildAbsoluteUrl("/reset-password"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ResetPasswordForm />
    </div>
  );
}
