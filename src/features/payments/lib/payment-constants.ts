import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type PaymentResultStatus =
  | "failure"
  | "invalid"
  | "partial_success"
  | "pending"
  | "success"
  | "unverified"
  | "verification_error";

export interface PaymentStatusInfo {
  title: string;
  description: string;
  icon: typeof CheckCircle2;
  colorClass: string;
  bgClass: string;
}

export const PAYMENT_STATUS_MAP: Record<PaymentResultStatus, PaymentStatusInfo> = {
  success: {
    title: "Ödeme Başarılı!",
    description:
      "Hizmetiniz başarıyla tanımlandı. OtoBurada'yı tercih ettiğiniz için teşekkür ederiz.",
    icon: CheckCircle2,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500",
  },
  failure: {
    title: "Ödeme Başarısız",
    description: "Ödeme işlemi sırasında bir hata oluştu veya bankanız tarafından reddedildi.",
    icon: XCircle,
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500",
  },
  pending: {
    title: "Ödeme Doğrulanıyor",
    description:
      "Ödemeniz alındıysa doğrulama hâlâ sürüyor olabilir. Lütfen kısa süre sonra tekrar kontrol edin.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  invalid: {
    title: "Geçersiz Bağlantı",
    description: "Bu ödeme bağlantısı geçersiz veya eksik. Lütfen ödeme akışını yeniden başlatın.",
    icon: XCircle,
    colorClass: "text-rose-600",
    bgClass: "bg-rose-500",
  },
  unverified: {
    title: "Ödeme Henüz Doğrulanamadı",
    description: "Ödeme sonucu şu an doğrulanamadı. Birkaç dakika sonra tekrar kontrol edin.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  verification_error: {
    title: "Doğrulama Hatası",
    description: "Ödeme doğrulaması sırasında geçici bir hata oluştu. Lütfen tekrar deneyin.",
    icon: XCircle,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
  partial_success: {
    title: "Ödeme Alındı",
    description:
      "Ödemeniz başarıldı ancak ek hizmetlerin aktivasyonu zaman alabilir. En kısa sürede aktive edilecektir.",
    icon: Loader2,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500",
  },
};
