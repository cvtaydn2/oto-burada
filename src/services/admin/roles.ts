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

  const { data: roles } = await admin
    .from("roles")
    .select("*")
    .order("name");

  const { data: profiles } = await admin
    .from("profiles")
    .select("role");

  const roleCountMap: Record<string, number> = {};
  profiles?.forEach((p) => {
    const r = p.role || "user";
    roleCountMap[r] = (roleCountMap[r] ?? 0) + 1;
  });

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

  if (roles && roles.length > 0) {
    const customRoles: AdminRole[] = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions || [],
      user_count: roleCountMap[r.id] ?? 0,
      is_system: false,
    }));
    return [...defaultRoles, ...customRoles];
  }

  return defaultRoles;
}

export async function createRole(name: string, description: string, permissions: string[]) {
  const admin = createSupabaseAdminClient();
  
  const { error } = await admin
    .from("roles")
    .insert({
      name,
      description,
      permissions,
    });

  if (error) throw error;
  return { success: true };
}

export async function updateRole(id: string, updates: { name?: string; description?: string; permissions?: string[] }) {
  const admin = createSupabaseAdminClient();
  
  const { error } = await admin
    .from("roles")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}

export async function deleteRole(id: string) {
  const admin = createSupabaseAdminClient();
  
  const { error } = await admin
    .from("roles")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return { success: true };
}