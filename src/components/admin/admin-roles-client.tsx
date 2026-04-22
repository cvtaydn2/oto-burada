"use client";

import { useState } from "react";
import { Shield, Key, Eye, ChevronRight, CheckCircle2 } from "lucide-react";
import type { AdminRole } from "@/services/admin/roles";
import { Button } from "@/components/ui/button";

interface AdminRolesClientProps {
  initialRoles: AdminRole[];
}

const roleColors: Record<string, string> = {
  admin: "bg-slate-900",
  moderator: "bg-blue-600",
  support: "bg-indigo-600",
  user: "bg-slate-400",
};

export function AdminRolesClient({ initialRoles }: AdminRolesClientProps) {
  const [roles] = useState(initialRoles);

  const getAccessLabel = (permissions: string[]) => {
    if (permissions.includes("all")) return "Tüm yetkiler";
    const labels = permissions.map((p) => {
      const [module, action] = p.split(".");
      const moduleLabels: Record<string, string> = {
        listings: "İlan",
        reports: "Rapor",
        tickets: "Ticket",
        users: "Kullanıcı",
        settings: "Ayarlar",
      };
      const actionLabels: Record<string, string> = {
        manage: "Yönet",
        approve: "Onayla",
        reject: "Reddet",
        create: "Oluştur",
        view: "Görüntüle",
        update: "Güncelle",
      };
      return `${moduleLabels[module] || module} ${actionLabels[action] || action}`;
    });
    return labels.slice(0, 2).join(", ") + (labels.length > 2 ? "..." : "");
  };

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="text-primary" size={16} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] italic">
              Erişim kontrolü
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Roller ve <span className="text-blue-600">Yetkiler</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic">
            Sistem rolleri sabit tanımlıdır. Özel rol yönetimi yakında eklenecek.
          </p>
        </div>
        {/*
          Create/Edit/Delete buttons are intentionally hidden.
          The backend stubs (createRole, updateRole, deleteRole) throw errors
          because a custom roles table has not been added to the DB yet.
          Re-enable these controls once migration 0043_custom_roles_table.sql is applied.
        */}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-200"
          >
            <div className="relative space-y-3 p-6 bg-slate-50 border-b border-slate-100">
              <div
                className={`size-10 rounded-xl ${roleColors[role.id] ?? "bg-slate-500"} flex items-center justify-center text-white`}
              >
                <Shield size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                  {role.is_system && (
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Sistem
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {role.user_count} atanmış kişi
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Erişim Kapsamı
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-medium text-slate-900 truncate">
                    {getAccessLabel(role.permissions)}
                  </span>
                </div>
              </div>

              {/* View-only action — edit/delete hidden until backend is ready */}
              <button className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-xs font-medium">
                <Eye size={16} />
                Detayları Gör
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="flex size-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Shield className="fill-indigo-600/10" size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Gelişmiş erişim logları</h4>
              <p className="text-sm text-slate-500">
                Hangi yetkinin ne zaman ve kim tarafından kullanıldığını inceleyin.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-all hover:border-blue-300 hover:text-blue-600"
            asChild
          >
            <a href="/admin/audit">
              Logları görüntüle
              <ChevronRight size={18} />
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}
