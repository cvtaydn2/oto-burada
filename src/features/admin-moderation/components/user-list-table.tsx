"use client";

import Link from "next/link";

import { Badge } from "@/features/ui/components/badge";
import { cn, safeFormatDate, safeFormatDistanceToNow } from "@/lib";
import { trust } from "@/lib/ui-strings";
import { type Profile } from "@/types";

import { UserActionMenu } from "./user_action_menu";

interface UserListTableProps {
  users: Profile[];
}

export function UserListTable({ users }: UserListTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <caption className="sr-only">Platform kullanıcıları listesi</caption>
        <thead>
          <tr className="bg-muted/50 border-b border-border/50">
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Profil
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              İletişim
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Rol
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Kredi
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Kayıt
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Son Giriş
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Doğrulama
            </th>
            <th className="p-6 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
              Durum
            </th>
            <th className="p-6 text-right text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.2em]">
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
                        className="text-sm font-bold text-foreground block leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase hover:underline"
                      >
                        {u.fullName || "İsimsiz Kullanıcı"}
                      </Link>
                      <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter italic">
                        #{u.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-sm font-medium text-muted-foreground italic lowercase">
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
                      "text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider",
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
                      ? safeFormatDistanceToNow(userWithLogin.lastSignInAt)
                      : "—"}
                  </span>
                </td>
                <td className="p-6">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter border-none",
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
                      {!u.isBanned ? trust.admin.userStatus.active : trust.admin.userStatus.banned}
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
  );
}
