import type { PropsWithChildren } from "react";

/**
 * Auth layout — minimal shell without the public header/footer/mobile-nav.
 * Login, register, forgot-password ve reset-password sayfaları bu layout'u kullanır.
 * AuthForm kendi min-h-screen yapısını içeriyor; ekstra nav distraksiyon yaratır.
 */
export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <main id="auth-main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
