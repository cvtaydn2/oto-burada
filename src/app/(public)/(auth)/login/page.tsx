import type { Metadata } from "next";

import { AuthForm } from "@/components/forms/auth-form";
import { loginAction } from "@/features/auth/lib/actions";
import { buildAbsoluteUrl } from "@/features/seo/lib";

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string;
  }>;
}

export const metadata: Metadata = {
  title: "Giriş Yap | OtoBurada",
  description:
    "OtoBurada hesabınıza giriş yaparak ilanlarınızı, favorilerinizi ve mesajlarınızı yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/login"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <div className="flex-1 flex flex-col">
      <AuthForm
        action={loginAction}
        submitLabel="Giriş Yap"
        alternateHref="/register"
        alternateLabel="Kayıt Ol"
        mode="login"
        next={resolvedSearchParams?.next}
      />
    </div>
  );
}
