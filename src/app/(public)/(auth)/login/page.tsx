import { AuthForm } from "@/components/forms/auth-form";
import { loginAction } from "@/features/auth/lib/actions";

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string;
  }>;
}

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
