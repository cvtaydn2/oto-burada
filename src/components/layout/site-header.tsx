import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { primaryNavigationItems } from "@/components/layout/public-navigation";
import { brandCatalog } from "@/data";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="text-base font-semibold">OB</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">Oto Burada</p>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {brandCatalog.length}+ marka ile sade araba ilan pazaryeri
              </p>
            </div>
          </Link>
        </div>

        <nav aria-label="Ana menü" className="hidden items-center gap-1 lg:flex">
          {primaryNavigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Güvenli ve sade platform
          </div>
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Giriş Yap
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            İlan Ver
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
