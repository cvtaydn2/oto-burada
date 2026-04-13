"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin panel hatası:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <Shield className="size-8 text-red-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Yönetici Paneli Hatası</h2>
      <p className="mb-6 text-muted-foreground">
        Bu sayfayı yüklerken bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.href = "/admin"}>
          <Shield className="mr-2 size-4" />
          Admin Ana Sayfa
        </Button>
        <Button onClick={reset}>Tekrar Dene</Button>
      </div>
    </div>
  );
}