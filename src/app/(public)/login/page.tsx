import { AuthForm } from "@/components/forms/auth-form";
import { loginAction } from "@/lib/auth/actions";

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col">
      <AuthForm
        action={loginAction}
        title="Giriş"
        description="Hesabına giriş yap"
        submitLabel="Giriş Yap"
        alternateHref="/register"
        alternateLabel="Kayıt Ol"
        mode="login"
      />
    </div>
  );
}
