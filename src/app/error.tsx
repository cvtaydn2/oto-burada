"use client";

import { AppErrorBoundary } from "@/components/shared/error-boundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AppErrorBoundary error={error} reset={reset} />
    </div>
  );
}
