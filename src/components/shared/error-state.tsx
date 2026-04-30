import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: React.ElementType;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  homeLink?: boolean;
  backLink?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Bir Hata Oluştu",
  message = "Beklenmedik bir sorun oluştu. Lütfen tekrar deneyin.",
  icon: Icon = AlertCircle,
  iconColor = "text-rose-600",
  action,
  homeLink = false,
  backLink = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30">
        <Icon className={cn("size-10", iconColor)} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3 className="mb-3 text-xl font-bold text-foreground tracking-tight">{title}</h3>

      {/* Message */}
      <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed">{message}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        {action && (
          <Button onClick={action.onClick} className="flex-1 gap-2" size="lg">
            <RefreshCw className="size-4" />
            {action.label}
          </Button>
        )}

        {backLink && (
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex-1 gap-2"
            size="lg"
          >
            <ArrowLeft className="size-4" />
            Geri Dön
          </Button>
        )}

        {homeLink && (
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2" size="lg">
              <Home className="size-4" />
              Ana Sayfa
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

// Preset variants for common error types
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Bağlantı Hatası"
      message="İnternet bağlantınızı kontrol edin ve tekrar deneyin."
      icon={AlertCircle}
      iconColor="text-amber-600"
      action={
        onRetry
          ? {
              label: "Tekrar Dene",
              onClick: onRetry,
            }
          : undefined
      }
      backLink
    />
  );
}

export function NotFoundError() {
  return (
    <ErrorState
      title="Sayfa Bulunamadı"
      message="Aradığınız sayfa mevcut değil veya taşınmış olabilir."
      icon={AlertCircle}
      iconColor="text-slate-600"
      homeLink
      backLink
    />
  );
}

export function PermissionError() {
  return (
    <ErrorState
      title="Erişim Reddedildi"
      message="Bu sayfayı görüntülemek için yetkiniz bulunmuyor."
      icon={AlertCircle}
      iconColor="text-rose-600"
      homeLink
    />
  );
}
