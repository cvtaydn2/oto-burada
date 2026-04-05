import { AuthForm } from "@/components/forms/auth-form";
import { registerAction } from "@/lib/auth/actions";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <AuthForm
        action={registerAction}
        title="Kayıt Ol"
        description="Ücretsiz ilan vermeye başla"
        submitLabel="Hesap Oluştur"
        alternateHref="/login"
        alternateLabel="Giriş Yap"
        mode="register"
      />
    </main>
  );
}
