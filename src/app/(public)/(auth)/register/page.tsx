import { AuthForm } from "@/components/forms/auth-form";
import { registerAction } from "@/lib/auth/actions";

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
