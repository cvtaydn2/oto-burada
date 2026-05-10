import { Database, Filter } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { BrandsManager } from "@/features/admin-moderation/components/brands-manager";
import { UserSearch } from "@/features/admin-moderation/components/user-search";
import { getBrands } from "@/features/admin-moderation/services/reference";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Referans Veriler | OtoBurada",
  description: "Marka, model ve referans araç veritabanını yönetim panelinden yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/reference"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminUser();
  const { q } = await searchParams;
  const brands = await getBrands(q);

  return (
    <main className="space-y-8 p-6 lg:p-8 bg-muted/30 min-h-full">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
              Veri & Envanter
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Araç <span className="text-blue-600">Veritabanı</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium italic">
            Sistemdeki marka, model ve donanım kütüphanesini yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl font-bold text-[10px] tracking-widest uppercase h-11 px-6 bg-card border-border"
          >
            <Filter size={16} className="mr-2" />
            FİLTRELE
          </Button>
        </div>
      </section>

      <div className="grid gap-8">
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center text-blue-500 shadow-sm">
                <Database size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Marka Kütüphanesi</h3>
                <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-tighter">
                  Toplam {brands.length} marka kayıtlı
                </p>
              </div>
            </div>
            <UserSearch defaultValue={q} />
          </div>

          <BrandsManager initialBrands={brands} />
        </div>
      </div>
    </main>
  );
}
