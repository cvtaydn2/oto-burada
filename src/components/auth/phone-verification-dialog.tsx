"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { LoaderCircle, Smartphone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PhoneVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onSuccess?: () => void;
}

export function PhoneVerificationDialog({
  isOpen,
  onOpenChange,
  initialPhone = "",
  onSuccess
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast.error("Lütfen geçerli bir telefon numarası girin.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      if (data.success) {
        setStep("otp");
        toast.success("Doğrulama kodu gönderildi.");
      } else {
        toast.error(data.error || "Kod gönderilemedi.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-phone/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await response.json();
      if (data.success) {
        setStep("success");
        onSuccess?.();
      } else {
        toast.error(data.error || "Geçersiz kod.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${step === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
              {step === 'success' ? <CheckCircle2 size={32} /> : <Smartphone size={32} />}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {step === "phone" && "Telefon Doğrulama"}
            {step === "otp" && "Kod Girin"}
            {step === "success" && "Başarılı!"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "phone" && "Güvenliğiniz için telefon numaranızı doğrulamanız gerekmektedir."}
            {step === "otp" && `${phone} numarasına gönderilen 6 haneli kodu girin.`}
            {step === "success" && "Telefon numaranız başarıyla doğrulandı. Artık güvenle ilan verebilirsiniz."}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" && (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input 
                id="phone" 
                placeholder="5xx xxx xx xx" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              className="w-full h-12 rounded-xl text-lg font-semibold" 
              onClick={handleSendOtp}
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : null}
              Kod Gönder
            </Button>
          </div>
        )}

        {step === "otp" && (
          <div className="py-4 space-y-6 flex flex-col items-center">
            <InputOTP 
              maxLength={6} 
              value={otp} 
              onChange={setOtp}
              disabled={isLoading}
            >
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
                className="w-full h-12 rounded-xl text-lg font-semibold" 
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : null}
                Doğrula
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => setStep("phone")}
                disabled={isLoading}
              >
                Numarayı Değiştir
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-4">
            <Button 
              className="w-full h-12 rounded-xl text-lg font-semibold" 
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
