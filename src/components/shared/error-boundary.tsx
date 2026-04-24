"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, ReactNode, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Legacy Class Component Error Boundary for wrapping specific components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.system.error("ErrorBoundary caught an error", error, {
      componentStack: errorInfo.componentStack?.slice(0, 500) ?? undefined,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
              Bir şeyler yanlış gitti
            </h3>
            <p className="text-sm text-red-700/80 dark:text-red-300/70">
              Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Dene
            </Button>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/")}>
              <Home className="mr-2 h-4 w-4" />
              Ana Sayfa
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional Error Boundary for Next.js error.tsx files
 */
interface AppErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export function AppErrorBoundary({
  error,
  reset,
  title = "Bir Şeyler Ters Gitti",
}: AppErrorBoundaryProps) {
  useEffect(() => {
    logger.system.error("[AppErrorBoundary] Global Error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="size-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">{title}</h2>
      <p className="text-muted-foreground font-medium max-w-md mx-auto mb-8">
        İşlem sırasında beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya sorun
        devam ederse destek ekibimize bildirin.
      </p>
      {error.digest && (
        <div className="mb-8 px-3 py-1 rounded-lg bg-slate-100 text-[10px] font-mono text-slate-500">
          Hata Kodu: {error.digest}
        </div>
      )}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => reset()}
          className="bg-slate-900 hover:bg-black text-white h-12 px-8 rounded-xl font-bold flex items-center gap-2"
        >
          <RefreshCw size={18} />
          TEKRAR DENE
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
          className="h-12 px-8 rounded-xl font-bold"
        >
          ANA SAYFAYA DÖN
        </Button>
      </div>
    </div>
  );
}
