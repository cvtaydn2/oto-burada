"use client";

import { useEffect } from "react";
import { posthog } from "@/lib/monitoring/posthog-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report unhandled global errors to PostHog
    posthog.capture("$exception", {
      error_name: error.name,
      error_message: error.message,
      error_digest: error.digest,
      context: "global_error_boundary",
    });
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Beklenmedik bir hata oluştu</h1>
          <p className="text-slate-500 text-sm">
            Ekibimiz otomatik olarak bilgilendirildi. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={reset}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
