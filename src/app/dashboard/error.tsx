"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sayfa hatası:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <AlertTriangle className="size-8 text-red-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">Bir şeyler ters gitti</h2>
      <p className="mb-6 text-muted-foreground">
        Bu sayfayı yüklerken bir hata oluştu.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
          <Home className="mr-2 size-4" />
          Panele Dön
        </Button>
        <Button onClick={reset}>Tekrar Dene</Button>
      </div>
    </div>
  );
}