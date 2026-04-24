"use client";

import Link from "next/link";
import { useEffect } from "react";

import { captureClientException } from "@/lib/monitoring/posthog-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientException(error, "global-error", { digest: error.digest });
  }, [error, error.digest]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Bir hata oluştu</h1>
            <p className="text-gray-600">
              Teknik bir sorun yaşandı. Lütfen sayfayı yenilemeyi deneyin.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 font-mono">Hata Kodu: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              Sayfayı Yenile
            </button>
            <Link
              href="/"
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Sorun devam ederse lütfen{" "}
            <Link href="/iletisim" className="text-blue-600 hover:underline">
              destek ekibiyle iletişime geçin
            </Link>
            .
          </p>
        </div>
      </body>
    </html>
  );
}
