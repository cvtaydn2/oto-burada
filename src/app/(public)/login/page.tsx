import { AuthForm } from "@/components/forms/auth-form";
import { loginAction } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <AuthForm
        action={loginAction}
        title="Giriş"
        description="Hesabına giriş yap"
        submitLabel="Giriş Yap"
        alternateHref="/register"
        alternateLabel="Kayıt Ol"
        mode="login"
      />
    </main>
  );
}
