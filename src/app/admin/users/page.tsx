import { ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SimplePagination } from "@/features/admin-moderation/components/simple-pagination";
import { UserHeaderActions } from "@/features/admin-moderation/components/user-header-actions";
import { UserListTable } from "@/features/admin-moderation/components/user-list-table";
import { UserSearch } from "@/features/admin-moderation/components/user-search";
import { UserStatsBar } from "@/features/admin-moderation/components/user-stats-bar";
import { getAllUsers } from "@/features/admin-moderation/services/admin/user-list";
import { requireAdminUser } from "@/features/auth/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminUserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminUser();
  const { q, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { users, total, limit } = await getAllUsers(q, currentPage);
  const totalPages = Math.ceil(total / limit);

  // Tüm DB'den gerçek sayılar — sadece mevcut sayfa değil
  const admin = (await import("@/lib/admin")).createSupabaseAdminClient();
  const [{ count: totalActive }, { count: totalProfessional }, { count: totalBanned }] =
    await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", false),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("user_type", "professional"),
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_banned", true),
    ]);

  const stats = [
    { label: "Tüm Kullanıcılar", value: total.toLocaleString("tr-TR"), color: "text-foreground" },
    {
      label: "Aktif",
      value: (totalActive ?? 0).toLocaleString("tr-TR"),
      color: "text-emerald-600",
    },
    {
      label: "Kurumsal",
      value: (totalProfessional ?? 0).toLocaleString("tr-TR"),
      color: "text-blue-600",
    },
  ];

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-full bg-muted/30 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em] italic">
              Admin Çözüm Merkezi
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Kullanıcı <span className="text-blue-600">Yönetimi</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground font-medium italic">
            Platform genelindeki üye kayıtlarını ve yetkilerini buradan kontrol edin.
          </p>
        </div>
        <UserHeaderActions />
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="space-y-8 lg:col-span-3">
          <UserStatsBar stats={stats} currentPage={currentPage} totalPages={totalPages} />

          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border/50 bg-muted/30 flex flex-col md:flex-row md:items-center gap-4">
              <UserSearch defaultValue={q} />
            </div>

            <UserListTable users={users} />

            <div className="p-4 bg-muted/50 border-t border-border/50">
              <SimplePagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCog size={18} />
              </div>
              <h3 className="text-base font-bold text-foreground tracking-tight">Hızlı İşlemler</h3>
            </div>
            <div className="space-y-3">
              <Link href="/admin/roles">
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-border/50 text-muted-foreground font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 hover:bg-muted/30 transition-all"
                >
                  <ShieldCheck size={16} />
                  Yetki Matrisi
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-3">Özet</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Toplam kayıt</span>
                <span className="font-bold text-foreground">{total}</span>
              </div>
              <div className="flex justify-between">
                <span>Bu sayfada</span>
                <span className="font-bold text-foreground">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Yasaklı</span>
                <span className="font-bold text-rose-600">{totalBanned ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
