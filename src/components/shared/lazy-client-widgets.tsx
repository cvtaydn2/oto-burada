"use client";

import dynamicImport from "next/dynamic";
import { Suspense } from "react";

const CookieConsent = dynamicImport(
  () => import("@/components/shared/cookie-consent").then((m) => m.CookieConsent),
  {
    ssr: false,
  }
);

const PWAInstallPrompt = dynamicImport(
  () => import("@/components/shared/pwa-install-prompt").then((m) => m.PWAInstallPrompt),
  {
    ssr: false,
  }
);

const WhatsAppSupport = dynamicImport(
  () => import("@/components/shared/whatsapp-support").then((m) => m.WhatsAppSupport),
  {
    ssr: false,
  }
);

export function LazyClientWidgets() {
  return (
    <Suspense fallback={null}>
      <CookieConsent />
      <PWAInstallPrompt />
      <WhatsAppSupport />
    </Suspense>
  );
}
