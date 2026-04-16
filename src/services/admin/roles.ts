"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  user_count: number;
  is_system: boolean;
}

export async function getAdminRoles(): Promise<AdminRole[]> {
  const admin = createSupabaseAdminClient();

  // profiles tablosundan rol dağılımını hesapla
  const { data: profiles } = await admin
    .from("profiles")
    .select("role");

  const roleCountMap: Record<string, number> = {};
  profiles?.forEach((p) => {
    const r = p.role || "user";
    roleCountMap[r] = (roleCountMap[r] ?? 0) + 1;
  });

  // Sistem rolleri — DB'de ayrı bir roles tablosu yok, bunlar sabit tanımlar
  const defaultRoles: AdminRole[] = [
    {
      id: "admin",
      name: "Süper Admin",
      description: "Tüm sistem yetkilerine sahip",
      permissions: ["all"],
      user_count: roleCountMap["admin"] ?? 0,
      is_system: true,
    },
    {
      id: "moderator",
      name: "Moderatör",
      description: "İlan ve rapor yönetimi",
      permissions: ["listings.approve", "listings.reject", "reports.manage"],
      user_count: roleCountMap["moderator"] ?? 0,
      is_system: true,
    },
    {
      id: "support",
      name: "Destek Ekibi",
      description: "Kullanıcı desteği ve ticket yönetimi",
      permissions: ["tickets.manage", "users.view"],
      user_count: roleCountMap["support"] ?? 0,
      is_system: true,
    },
    {
      id: "user",
      name: "Kullanıcı",
      description: "Standart kullanıcı rolü",
      permissions: ["listings.create", "profile.update"],
      user_count: roleCountMap["user"] ?? 0,
      is_system: true,
    },
  ];

  return defaultRoles;
}

// These stub functions exist for forward-compatibility.
// When a custom roles table is added to the DB, replace the throw with real logic.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createRole(_name: string, _description: string, _permissions: string[]): Promise<never> {
  throw new Error("Özel rol oluşturma henüz desteklenmiyor.");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateRole(_id: string, _updates: { name?: string; description?: string; permissions?: string[] }): Promise<never> {
  throw new Error("Sistem rolleri değiştirilemez.");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteRole(_id: string): Promise<never> {
  throw new Error("Sistem rolleri silinemez.");
}