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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[1400px] w-full px-4 py-8">

        {/* Top Header */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex size-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400 border border-gray-100 transition hover:bg-white hover:text-blue-500 hover:border-blue-100 hover:shadow-sm"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-0.5">
                  Satıcı Paneli
                </p>
                <h1 className="text-xl font-bold text-gray-900 leading-none">
                  {email ?? "Kullanıcı"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" className="h-9 border-blue-100 bg-blue-50/50 text-blue-700 hover:bg-blue-50 gap-2 font-bold rounded-xl shadow-sm text-xs">
                    <ShieldCheck size={15} />
                    Admin Paneli
                  </Button>
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-red-500 hover:border-red-100"
                >
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="rounded-xl border border-gray-200 bg-white overflow-hidden py-2 md:sticky md:top-24 shadow-sm">
              <DashboardNavigation variant="sidebar" />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
