"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import React, { Component, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logging/logger";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
  error?: Error | null;
  reset?: () => void;
  title?: string;
  description?: string;
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

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-900/10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-red-900 dark:text-red-100">
            {this.props.title || "Bir Şeyler Yanlış Gitti"}
          </h3>
          <p className="mb-6 max-w-md text-sm text-red-700 dark:text-red-400">
            {this.props.description ||
              "Bu bölüm yüklenirken bir hata oluştu. Lütfen tekrar deneyin veya sayfayı yenileyin."}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="flex items-center gap-2 border-red-200 hover:bg-red-100 dark:border-red-900/50 dark:hover:bg-red-900/20"
          >
            <RefreshCcw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
