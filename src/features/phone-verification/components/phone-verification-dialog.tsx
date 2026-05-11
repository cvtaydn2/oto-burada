"use client";

import { CheckCircle2, LoaderCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useErrorCapture } from "@/hooks/use-error-capture";

import {
  initiatePhoneVerificationAction,
  verifyPhoneCodeAction,
} from "../services/phone-verification/phone-verification-actions";

interface PhoneVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  onSuccess?: () => void;
}

export function PhoneVerificationDialog({
  isOpen,
  onOpenChange,
  phoneNumber,
  onSuccess,
}: PhoneVerificationDialogProps) {
  const { captureError } = useErrorCapture("phone-verification-dialog");
  const [step, setStep] = useState<"send" | "otp" | "success">("send");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Lütfen önce geçerli bir telefon numarası girin.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await initiatePhoneVerificationAction(phoneNumber);
      if (result.status === "success") {
        setStep("otp");
        toast.success(result.message);
      } else {
        toast.error(result.message || "Kod gönderilemedi.");
      }
    } catch (err) {
      captureError(err, "handleSendOtp");
      toast.error("Doğrulama kodu başlatılırken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setIsLoading(true);
    try {
      const result = await verifyPhoneCodeAction(phoneNumber, otp);
      if (result.status === "success") {
        setStep("success");
        onSuccess?.();
        toast.success(result.message);
      } else {
        toast.error(result.message || "Geçersiz kod.");
      }
    } catch (err) {
      captureError(err, "handleVerifyOtp");
      toast.error("Doğrulama işlemi sırasında hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when reopening
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset slightly delayed so animation finishes
      setTimeout(() => {
        setStep("send");
        setOtp("");
      }, 200);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div
              className={`p-4 rounded-full ${
                step === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {step === "success" ? <CheckCircle2 size={32} /> : <Phone size={32} />}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {step === "send" && "Telefon Doğrulama"}
            {step === "otp" && "Kodu Girin"}
            {step === "success" && "Başarılı!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "send" &&
              `${phoneNumber} numaralı telefona 6 haneli SMS doğrulama kodu göndereceğiz.`}
            {step === "otp" && "Telefonunuza SMS ile gönderilen 6 haneli kodu girin."}
            {step === "success" && "Telefon numaranız başarıyla doğrulandı."}
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
              SMS Gönder
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
                onClick={() => {
                  setStep("send");
                  setOtp("");
                }}
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
              onClick={() => handleOpenChange(false)}
            >
              Kapat
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
