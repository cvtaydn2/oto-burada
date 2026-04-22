/**
 * PostHog initialization — Next.js 15.3+ instrumentation-client pattern.
 * Runs before the app initializes on the client side.
 *
 * defaults: '2026-01-30' automatically enables:
 *   - Exception autocapture (unhandled JS errors + promise rejections)
 *   - Session recording (Session Replay)
 *   - Web vitals
 *   - Dead clicks / rage clicks
 *   - Pageview capture (disabled below — manually captured in PostHogProvider)
 *
 * PII Protection:
 *   - sanitize_properties: Emails, phone numbers, TC kimlik maskelenir.
 *   - Session Replay: Input maskeleme varsayılan olarak aktif (defaults'a dahil).
 *
 * Docs: https://posthog.com/docs/error-tracking/installation/nextjs
 */
import posthog from "posthog-js";

const posthogProjectToken =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (posthogProjectToken) {
  posthog.init(posthogProjectToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",

    // Sayfa görüntülemeleri PostHogProvider'da manuel olarak tetikleniyor
    capture_pageview: false,

    // Cookie consent — opt-in yapılana kadar veri toplanmaz
    opt_out_capturing_by_default: true,

    // ── PII Maskeleme (sanitize_properties) ─────────────────────────────────
    sanitize_properties: (properties) => {
      const piiKeys = new Set([
        "email",
        "phone",
        "tc",
        "tc_no",
        "identity",
        "telefon",
        "tel",
        "kimlik",
      ]);

      for (const [key, value] of Object.entries(properties)) {
        if (typeof value !== "string") continue;

        // Mask any string that looks like an email address
        if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(value)) {
          properties[key] = "[EMAIL_REDACTED]";
          continue;
        }

        // Mask values under known PII keys
        if (piiKeys.has(key.toLowerCase())) {
          properties[key] = "[PII_REDACTED]";
          continue;
        }

        // Mask Turkish phone numbers (5xx xxx xxxx patterns)
        if (/(?:^|\s)(?:\+?90\s?)?5\d{2}\s?\d{3}\s?\d{2}\s?\d{2}(?:\s|$)/.test(value)) {
          properties[key] = "[PHONE_REDACTED]";
        }
      }

      // ── URL PII Maskeleme ──
      // URL'lerdeki email ve hassas query parametrelerini maskele
      const urlKeys = ["$current_url", "$pathname", "$referrer", "url"];
      for (const urlKey of urlKeys) {
        const urlValue = properties[urlKey];
        if (typeof urlValue !== "string") continue;

        try {
          const parsed = new URL(urlValue, "https://placeholder.local");
          let urlModified = false;

          // Query parametrelerindeki PII'yi maskele
          for (const [paramKey] of parsed.searchParams.entries()) {
            if (piiKeys.has(paramKey.toLowerCase())) {
              parsed.searchParams.set(paramKey, "[PII_REDACTED]");
              urlModified = true;
            }
          }

          // URL path'indeki email pattern'lerini maskele
          if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(parsed.pathname)) {
            // Replace email in pathname
            properties[urlKey] = urlValue.replace(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
              "[EMAIL_REDACTED]"
            );
          } else if (urlModified) {
            // Reconstruct URL with masked params
            properties[urlKey] = parsed.toString().replace("https://placeholder.local", "");
          }
        } catch {
          // URL parse failed — leave as is
        }
      }

      return properties;
    },
  });
}
