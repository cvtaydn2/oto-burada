"use client";

import { AppErrorBoundary } from "@/features/shared/components/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorBoundary error={error} reset={reset} />;
}
