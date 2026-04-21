"use client";

import NextError from "next/error";
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
      <body>
        {/* NextError renders a generic error page — statusCode 0 = unknown */}
        <NextError statusCode={0} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={reset}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
