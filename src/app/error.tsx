"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/shared/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry'ye error raporla (ücretsiz plan - 5k/ay limit)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error, {
          extra: {
            digest: error.digest,
          },
        });
      });
    }

    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <ErrorState
        title="Beklenmedik Bir Hata Oluştu"
        message={
          error.message ||
          "İşleminizi gerçekleştirirken sistemsel bir sorunla karşılaştık. Lütfen tekrar deneyin."
        }
        action={{
          label: "Tekrar Dene",
          onClick: () => {
            try {
              reset();
            } catch {
              window.location.reload();
            }
          },
        }}
        homeLink
      />
      {error.digest && (
        <div className="mt-4 rounded-lg bg-muted px-4 py-3 text-center">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Hata Takip Kodu
          </p>
          <code className="text-sm font-mono font-bold text-foreground">{error.digest}</code>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Lütfen bu kodu destek ekibine iletin.
          </p>
        </div>
      )}
    </div>
  );
}
