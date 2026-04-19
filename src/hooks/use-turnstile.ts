import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile React hook.
 * 
 * Manages the Turnstile widget lifecycle and provides a token for server-side verification.
 * 
 * Usage:
 * ```tsx
 * const { token, containerRef, reset } = useTurnstile();
 * 
 * <div ref={containerRef} />
 * 
 * // On form submit:
 * if (!token) {
 *   alert("Please complete the verification");
 *   return;
 * }
 * await fetch("/api/contact", {
 *   body: JSON.stringify({ ...formData, turnstileToken: token })
 * });
 * ```
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
          action?: string;
          cData?: string;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export interface UseTurnstileOptions {
  /** Turnstile site key (defaults to NEXT_PUBLIC_TURNSTILE_SITE_KEY) */
  siteKey?: string;
  /** Theme: "light" | "dark" | "auto" */
  theme?: "light" | "dark" | "auto";
  /** Action name for analytics (optional) */
  action?: string;
}

export interface UseTurnstileResult {
  /** The verification token (null until user completes challenge) */
  token: string | null;
  /** Ref to attach to the container div where the widget will render */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Reset the widget (e.g., after form submission) */
  reset: () => void;
  /** Whether Turnstile is enabled (site key is configured) */
  isEnabled: boolean;
}

export function useTurnstile(options: UseTurnstileOptions = {}): UseTurnstileResult {
  const siteKey = options.siteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [token, setToken] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  const isEnabled = Boolean(siteKey);

  useEffect(() => {
    if (!isEnabled || !containerRef.current) return;

    // Load Turnstile script if not already loaded
    if (!scriptLoadedRef.current && !window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      scriptLoadedRef.current = true;

      script.onload = () => {
        renderWidget();
      };
    } else if (window.turnstile) {
      renderWidget();
    }

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || !siteKey) return;

      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (responseToken: string) => {
          setToken(responseToken);
        },
        "error-callback": () => {
          setToken(null);
        },
        "expired-callback": () => {
          setToken(null);
        },
        theme: options.theme ?? "auto",
        size: "normal",
        action: options.action,
      });

      setWidgetId(id);
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [isEnabled, siteKey, options.theme, options.action, widgetId]);

  const reset = () => {
    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
      setToken(null);
    }
  };

  return {
    token,
    containerRef,
    reset,
    isEnabled,
  };
}
