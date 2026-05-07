"use client";

import { AppErrorBoundary } from "@/features/shared/components/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <AppErrorBoundary error={error} reset={reset} title="Dashboard Hatası" />
    </div>
  );
}
