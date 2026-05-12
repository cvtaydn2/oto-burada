"use server";

import { requireAdminServiceContext } from "./admin-service-context";

export interface AdminRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  user_count: number;
  is_system: boolean;
}

/**
 * Fetch all roles — system roles from custom_roles table + user counts from profiles.
 * Falls back to hardcoded defaults if the custom_roles table doesn't exist yet
 * (i.e. migration 0043 hasn't been applied).
 */
export async function getAdminRoles(): Promise<AdminRole[]> {
  const { admin } = await requireAdminServiceContext();

  // Get user counts per role from profiles
  const { data: profiles } = await admin.from("profiles").select("role");
  const roleCountMap: Record<string, number> = {};
  profiles?.forEach((p) => {
    const r = p.role || "user";
    roleCountMap[r] = (roleCountMap[r] ?? 0) + 1;
  });

  // Try to fetch from custom_roles table (requires migration 0043)
  const { data: customRoles, error } = await admin
    .from("custom_roles")
    .select("id, name, description, permissions, is_system")
    .order("is_system", { ascending: false })
    .order("name");

  if (!error && customRoles && customRoles.length > 0) {
    // Map DB rows to AdminRole, injecting live user counts for system roles
    const systemRoleNameToKey: Record<string, string> = {
      "Süper Admin": "admin",
      Moderatör: "moderator",
      "Destek Ekibi": "support",
      Kullanıcı: "user",
    };

    return customRoles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions as string[],
      is_system: r.is_system,
      user_count: roleCountMap[systemRoleNameToKey[r.name] ?? r.name] ?? 0,
    }));
  }

  // Fallback: hardcoded system roles (migration not yet applied)
  return [
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
}

/**
 * Create a custom role.
 * Requires migration 0043_custom_roles_table.sql to be applied.
 */
export async function createRole(
  name: string,
  description: string,
  permissions: string[]
): Promise<AdminRole> {
  const { admin } = await requireAdminServiceContext();

  const { data, error } = await admin
    .from("custom_roles")
    .insert({ name, description: description || null, permissions, is_system: false })
    .select("id, name, description, permissions, is_system")
    .single<{
      id: string;
      name: string;
      description: string | null;
      permissions: string[];
      is_system: boolean;
    }>();

  if (error) {
    if (error.code === "42P01") {
      throw new Error("Özel rol tablosu henüz oluşturulmamış. Lütfen migration 0043'ü uygulayın.");
    }
    if (error.code === "23505") {
      throw new Error(`"${name}" adında bir rol zaten mevcut.`);
    }
    throw new Error(`Rol oluşturulamadı: ${error.message}`);
  }

  return { ...data, user_count: 0 };
}

/**
 * Update a custom (non-system) role.
 * System roles are immutable.
 */
export async function updateRole(
  id: string,
  updates: { name?: string; description?: string; permissions?: string[] }
): Promise<AdminRole> {
  const { admin } = await requireAdminServiceContext();

  // Guard: cannot update system roles
  const { data: existing } = await admin
    .from("custom_roles")
    .select("is_system")
    .eq("id", id)
    .single<{ is_system: boolean }>();

  if (existing?.is_system) {
    throw new Error("Sistem rolleri değiştirilemez.");
  }

  const { data, error } = await admin
    .from("custom_roles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, description, permissions, is_system")
    .single<{
      id: string;
      name: string;
      description: string | null;
      permissions: string[];
      is_system: boolean;
    }>();

  if (error) {
    throw new Error(`Rol güncellenemedi: ${error.message}`);
  }

  return { ...data, user_count: 0 };
}

/**
 * Delete a custom (non-system) role.
 * System roles cannot be deleted.
 */
export async function deleteRole(id: string): Promise<void> {
  const { admin } = await requireAdminServiceContext();

  // Guard: cannot delete system roles
  const { data: existing } = await admin
    .from("custom_roles")
    .select("is_system, name")
    .eq("id", id)
    .single<{ is_system: boolean; name: string }>();

  if (existing?.is_system) {
    throw new Error("Sistem rolleri silinemez.");
  }

  const { error } = await admin.from("custom_roles").delete().eq("id", id);

  if (error) {
    throw new Error(`Rol silinemedi: ${error.message}`);
  }
}
