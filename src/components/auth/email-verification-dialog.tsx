"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { LoaderCircle, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useErrorCapture } from "@/hooks/use-error-capture";

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailVerificationDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: EmailVerificationDialogProps) {
  const { captureError } = useErrorCapture("email-verification-dialog");
  const [step, setStep] = useState<"send" | "otp" | "success">("send");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        setStep("otp");
        toast.success("Doğrulama kodu e-posta adresinize gönderildi.");
      } else {
        toast.error(data.error || "Kod gönderilemedi.");
      }
    } catch (err) {
      captureError(err, "handleSendOtp");
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: otp }),
      });
      const data = await response.json();
      if (data.success) {
        setStep("success");
        onSuccess?.();
      } else {
        toast.error(data.error || "Geçersiz kod.");
      }
    } catch (err) {
      captureError(err, "handleVerifyOtp");
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${step === "success" ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}>
              {step === "success" ? <CheckCircle2 size={32} /> : <Mail size={32} />}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {step === "send" && "E-posta Doğrulama"}
            {step === "otp" && "Kodu Girin"}
            {step === "success" && "Başarılı!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "send" && "E-posta adresinize 6 haneli bir doğrulama kodu göndereceğiz."}
            {step === "otp" && "E-posta adresinize gönderilen 6 haneli kodu girin."}
            {step === "success" && "E-posta adresiniz başarıyla doğrulandı."}
          </DialogDescription>
        </DialogHeader>

        {step === "send" && (
          <div className="py-4">
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold"
              onClick={handleSendOtp}
              disabled={isLoading}
            >
              {isLoading && <LoaderCircle className="animate-spin mr-2" size={18} />}
              Doğrulama Kodu Gönder
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="py-4 space-y-6 flex flex-col items-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="w-full space-y-3">
              <Button
                className="w-full h-12 rounded-xl text-base font-semibold"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length < 6}
              >
                {isLoading && <LoaderCircle className="animate-spin mr-2" size={18} />}
                Doğrula
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => { setStep("send"); setOtp(""); }}
                disabled={isLoading}
              >
                Tekrar Gönder
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-4">
            <Button
              className="w-full h-12 rounded-xl text-base font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Kapat
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
