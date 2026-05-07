import { ForgotPasswordForm } from "@/features/forms/components/forgot-password-form";

export const metadata = {
  title: "Şifremi Unuttum | OtoBurada",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ForgotPasswordForm />
    </div>
  );
}
