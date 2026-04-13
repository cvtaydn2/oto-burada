import type { PropsWithChildren } from "react";
import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardShellProps extends PropsWithChildren {
  email: string | null;
  isAdmin?: boolean;
}

export function DashboardShell({ children, email, isAdmin }: DashboardShellProps) {
  return (
    <main className="bg-muted/40 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Ana sayfaya dön"
              >
                <ArrowLeft className="size-5" />
              </Link>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Kullanıcı Paneli
                </p>
                <h1 className="text-2xl font-black text-slate-900">Hesabını Yönet</h1>
                <p className="text-sm leading-5 text-muted-foreground">
                  {email ?? "Giriş yapan kullanıcı"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="h-10 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 gap-2 font-bold rounded-lg shadow-sm">
                    <ShieldCheck size={16} />
                    Admin Paneline Geç
                  </Button>
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </section>

        <DashboardNavigation />

        <div>{children}</div>
      </div>
    </main>
  );
}
