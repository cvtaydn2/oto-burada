import { loginAction } from "@/features/auth/lib/actions";
import { AuthForm } from "@/features/forms/components/auth-form";

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
