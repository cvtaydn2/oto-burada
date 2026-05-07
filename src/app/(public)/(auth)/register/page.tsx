import { registerAction } from "@/features/auth/lib/actions";
import { AuthForm } from "@/features/forms/components/auth-form";

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
