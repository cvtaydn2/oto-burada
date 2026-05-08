import { ResetPasswordForm } from "@/features/forms/components/reset-password-form";

export const metadata = {
  title: "Şifre Yenile | OtoBurada",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex flex-col">
      <ResetPasswordForm />
    </div>
  );
}
