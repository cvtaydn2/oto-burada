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
  const widgetIdRef = useRef<string | null>(null);

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

      // Cleanup previous widget if it exists to avoid double rendering
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (responseToken: string) => {
          setToken(responseToken);
        },
        "error-callback": () => {
          setToken(null);
          // Issue #29: Better error feedback for Turnstile failures
          console.error("[Turnstile] Verification failed. Widget will auto-reset.");
          // Auto-reset on error to allow retry
          setTimeout(() => {
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.reset(widgetIdRef.current);
            }
          }, 1000);
        },
        "expired-callback": () => {
          setToken(null);
          // Auto-reset on expiration
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
        theme: options.theme ?? "auto",
        size: "normal",
        action: options.action,
      });

      widgetIdRef.current = id;
      setWidgetId(id);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [isEnabled, siteKey, options.theme, options.action]); // widgetId NOT in dependencies

  const reset = () => {
    const currentId = widgetIdRef.current || widgetId;
    if (currentId && window.turnstile) {
      window.turnstile.reset(currentId);
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
