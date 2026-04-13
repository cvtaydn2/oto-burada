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
    <main className="bg-[#F8FAFC] min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100 transition hover:bg-white hover:text-blue-500 hover:border-blue-100 hover:shadow-sm"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
                  Satıcı Paneli
                </p>
                <h1 className="text-2xl font-black text-slate-900 leading-none">
                  Hesabını Yönet
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {email ?? "Kullanıcı"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="h-10 border-blue-100 bg-blue-50/50 text-blue-700 hover:bg-blue-50 gap-2 font-bold rounded-xl shadow-sm">
                    <ShieldCheck size={16} />
                    Admin Paneli
                  </Button>
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-red-500 hover:border-red-100"
                >
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </section>

        <DashboardNavigation />

        <div className="flex-1">{children}</div>
      </div>
    </main>
  );
}
