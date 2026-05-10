"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { safeFormatDate } from "@/lib/datetime/date-utils";
import { trust } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";
import { type Profile } from "@/types";

import { UserActionMenu } from "./user_action_menu";

interface UserListTableProps {
  users: Profile[];
}

export function UserListTable({ users }: UserListTableProps) {
  return (
    <>
      <div className="grid gap-3 p-4 md:hidden">
        {users.map((u) => {
          const userWithLogin = u as typeof u & { lastSignInAt: string | null };
          const vStatus = u.verificationStatus || "none";

          return (
            <article
              key={u.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Link href={`/admin/users/${u.id}`}>
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl text-sm font-bold transition-all cursor-pointer",
                        u.role === "admin"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {(u.fullName || "U")[0].toUpperCase()}
                    </div>
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="block truncate text-sm font-bold uppercase leading-none text-foreground hover:underline"
                    >
                      {u.fullName || "İsimsiz Kullanıcı"}
                    </Link>
                    <span className="mt-1 block text-[10px] font-bold uppercase italic tracking-tighter text-muted-foreground/70">
                      #{u.id.substring(0, 8)}
                    </span>
                  </div>
                </div>
                <UserActionMenu
                  userId={u.id}
                  isBanned={!!u.isBanned}
                  isAdmin={u.role === "admin"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  variant={
                    u.role === "admin"
                      ? "default"
                      : u.userType === "professional"
                        ? "secondary"
                        : "outline"
                  }
                  className={cn(
                    "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    u.role === "admin" ? "bg-blue-600 text-white" : ""
                  )}
                >
                  {u.role === "admin"
                    ? "Admin"
                    : u.userType === "professional"
                      ? "Kurumsal"
                      : "Bireysel"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                    vStatus === "approved"
                      ? "bg-emerald-50 text-emerald-600"
                      : vStatus === "pending"
                        ? "bg-amber-50 text-amber-600 animate-pulse"
                        : vStatus === "rejected"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-slate-50 text-slate-400"
                  )}
                >
                  {vStatus === "approved"
                    ? trust.admin.verificationStatus.approved
                    : vStatus === "pending"
                      ? trust.admin.verificationStatus.pending
                      : vStatus === "rejected"
                        ? trust.admin.verificationStatus.rejected
                        : trust.admin.verificationStatus.none}
                </Badge>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                    !u.isBanned
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-muted text-muted-foreground/70"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      !u.isBanned ? "bg-emerald-500" : "bg-slate-300",
                      !u.isBanned && "animate-pulse"
                    )}
                  />
                  {!u.isBanned ? trust.admin.userStatus.active : trust.admin.userStatus.banned}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="rounded-xl border border-border/10 bg-muted/30 px-3 py-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                    İletişim
                  </span>
                  <span className="mt-1 block text-sm font-medium lowercase text-foreground">
                    {u.phone || "—"}
                  </span>
                </div>
                <div className="rounded-xl border border-border/10 bg-muted/30 px-3 py-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                    Kredi
                  </span>
                  <span className="mt-1 block text-sm font-bold text-indigo-600">
                    {u.balanceCredits ?? 0} kr
                  </span>
                </div>
                <div className="rounded-xl border border-border/10 bg-muted/30 px-3 py-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                    Kayıt
                  </span>
                  <span className="mt-1 block font-medium text-foreground">
                    {safeFormatDate(u.createdAt, "dd MMM yy")}
                  </span>
                </div>
                <div className="rounded-xl border border-border/10 bg-muted/30 px-3 py-2">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                    Son Giriş
                  </span>
                  <span className="mt-1 block font-medium text-foreground">
                    {userWithLogin.lastSignInAt ? safeFormatDate(userWithLogin.lastSignInAt) : "—"}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Platform kullanıcıları listesi</caption>
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Profil
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                İletişim
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Rol
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Kredi
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Kayıt
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Son Giriş
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Doğrulama
              </th>
              <th className="p-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Durum
              </th>
              <th className="p-6 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => {
              const userWithLogin = u as typeof u & { lastSignInAt: string | null };
              const vStatus = u.verificationStatus || "none";

              return (
                <tr key={u.id} className="group transition-colors hover:bg-blue-50/20">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <Link href={`/admin/users/${u.id}`}>
                        <div
                          className={cn(
                            "flex size-11 items-center justify-center rounded-xl text-sm font-bold transition-all cursor-pointer",
                            u.role === "admin"
                              ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {(u.fullName || "U")[0].toUpperCase()}
                        </div>
                      </Link>
                      <div>
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="mb-1 block text-sm font-bold uppercase leading-none text-foreground transition-colors group-hover:text-blue-600 hover:underline"
                        >
                          {u.fullName || "İsimsiz Kullanıcı"}
                        </Link>
                        <span className="text-[10px] font-bold uppercase italic tracking-tighter text-muted-foreground/70">
                          #{u.id.substring(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-sm font-medium italic lowercase text-muted-foreground">
                      {u.phone || "—"}
                    </span>
                  </td>
                  <td className="p-6">
                    <Badge
                      variant={
                        u.role === "admin"
                          ? "default"
                          : u.userType === "professional"
                            ? "secondary"
                            : "outline"
                      }
                      className={cn(
                        "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                        u.role === "admin" ? "bg-blue-600 text-white" : ""
                      )}
                    >
                      {u.role === "admin"
                        ? "Admin"
                        : u.userType === "professional"
                          ? "Kurumsal"
                          : "Bireysel"}
                    </Badge>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-indigo-600">
                      {u.balanceCredits ?? 0} kr
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-muted-foreground">
                      {safeFormatDate(u.createdAt, "dd MMM yy")}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-muted-foreground/70">
                      {userWithLogin.lastSignInAt
                        ? safeFormatDate(userWithLogin.lastSignInAt)
                        : "—"}
                    </span>
                  </td>
                  <td className="p-6">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                        vStatus === "approved"
                          ? "bg-emerald-50 text-emerald-600"
                          : vStatus === "pending"
                            ? "bg-amber-50 text-amber-600 animate-pulse"
                            : vStatus === "rejected"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-slate-50 text-slate-400"
                      )}
                    >
                      {vStatus === "approved"
                        ? trust.admin.verificationStatus.approved
                        : vStatus === "pending"
                          ? trust.admin.verificationStatus.pending
                          : vStatus === "rejected"
                            ? trust.admin.verificationStatus.rejected
                            : trust.admin.verificationStatus.none}
                    </Badge>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          !u.isBanned ? "bg-emerald-500" : "bg-slate-300",
                          !u.isBanned && "animate-pulse"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          !u.isBanned ? "text-emerald-600" : "text-muted-foreground/70"
                        )}
                      >
                        {!u.isBanned
                          ? trust.admin.userStatus.active
                          : trust.admin.userStatus.banned}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <UserActionMenu
                      userId={u.id}
                      isBanned={!!u.isBanned}
                      isAdmin={u.role === "admin"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
