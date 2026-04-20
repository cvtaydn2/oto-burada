"use client";

import posthog from "posthog-js";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

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
