"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import React, { Component, ErrorInfo, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AppError, ErrorCode } from "@/types/errors";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  error?: Error;
  reset?: () => void;
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: "Bu işlemi yapmak için giriş yapmalısınız.",
  FORBIDDEN: "Bu işlem için yetkiniz bulunmuyor.",
  NOT_FOUND: "Aradığınız içerik bulunamadı.",
  VALIDATION_ERROR: "Lütfen bilgileri kontrol edip tekrar deneyin.",
  INTERNAL_ERROR: "Sunucu tarafında bir hata oluştu.",
  NETWORK_ERROR: "Bağlantı hatası oluştu. İnternetinizi kontrol edin.",
  UNKNOWN_ERROR: "Beklenmedik bir hata oluştu.",
};

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    const hasError = this.state.hasError || !!this.props.error;

    if (hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error || this.props.error;
      const code: ErrorCode = error instanceof AppError ? error.code : "UNKNOWN_ERROR";
      const message = ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
            <AlertCircle size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            {this.props.title || "Bir şeyler ters gitti"}
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">{message}</p>
          <Button
            onClick={this.props.reset || this.handleReset}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw size={16} />
            Tekrar Dene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
