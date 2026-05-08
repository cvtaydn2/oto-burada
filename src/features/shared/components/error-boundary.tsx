"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import React, { Component, type ReactNode } from "react";

import { Button } from "@/features/ui/components/button";
import { cn } from "@/lib";
import { logger } from "@/lib/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
  error?: Error | null;
  reset?: () => void;
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: !!props.error,
      error: props.error || null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.ui.error(`React Error Boundary [${this.props.name || "Unknown"}]:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    if (this.props.reset) {
      this.props.reset();
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isPageLevel = !this.props.children;

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg text-center",
            isPageLevel
              ? "min-h-[60vh] w-full px-4 py-12"
              : "min-h-[200px] border border-dashed border-red-200 bg-red-50 p-8 dark:border-red-900/30 dark:bg-red-900/10"
          )}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3
            className={cn(
              "mb-2 font-semibold",
              isPageLevel ? "text-2xl text-foreground" : "text-lg text-red-900 dark:text-red-100"
            )}
          >
            {this.props.title || "Bir Şeyler Yanlış Gitti"}
          </h3>
          <p
            className={cn(
              "mb-6 max-w-md text-sm",
              isPageLevel ? "text-muted-foreground" : "text-red-700 dark:text-red-400"
            )}
          >
            {this.props.description ||
              "Bu bölüm yüklenirken bir hata oluştu. Lütfen tekrar deneyin veya sayfayı yenileyin."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant={isPageLevel ? "default" : "outline"}
              size={isPageLevel ? "lg" : "sm"}
              onClick={this.handleReset}
              className={cn(
                "flex items-center gap-2",
                !isPageLevel &&
                  "border-red-200 hover:bg-red-100 dark:border-red-900/50 dark:hover:bg-red-900/20"
              )}
            >
              <RefreshCcw className="h-4 w-4" />
              Tekrar Dene
            </Button>

            {(this.props.showHomeButton || isPageLevel) && (
              <Button asChild variant="outline" size={isPageLevel ? "lg" : "sm"}>
                <Link href="/" className="flex items-center gap-2">
                  Ana Sayfaya Dön
                </Link>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
