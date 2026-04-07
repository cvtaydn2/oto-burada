import type { User } from "@supabase/supabase-js";

import { allUsers } from "@/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv } from "@/lib/supabase/env";
import { profileSchema } from "@/lib/validators";
import type { Profile } from "@/types";

interface ProfileRow {
  avatar_url: string | null;
  city: string;
  created_at: string;
  full_name: string;
  id: string;
  phone: string;
  role: Profile["role"];
  updated_at: string;
}

function mapProfileRow(row: ProfileRow) {
  return profileSchema.parse({
    avatarUrl: row.avatar_url,
    city: row.city,
    createdAt: row.created_at,
    fullName: row.full_name,
    id: row.id,
    phone: row.phone,
    role: row.role,
    updatedAt: row.updated_at,
  });
}

export function buildProfileFromAuthUser(user: User) {
  const metadata = user.user_metadata as {
    avatar_url?: string;
    city?: string;
    full_name?: string;
    phone?: string;
    role?: string;
  };
  const timestamp = new Date().toISOString();

  const rawProfile = {
    id: user.id,
    fullName: metadata.full_name ?? "",
    phone: metadata.phone ?? "",
    city: metadata.city ?? "",
    avatarUrl: metadata.avatar_url ?? null,
    role: (metadata.role === "admin" ? "admin" : "user") as Profile["role"],
    createdAt: user.created_at ?? timestamp,
    updatedAt: timestamp,
  };

  try {
    return profileSchema.parse(rawProfile);
  } catch {
    return {
      ...rawProfile,
      fullName: "Kullanıcı",
      phone: "",
      city: "",
    };
  }
}

export async function ensureProfileRecord(user: User) {
  const profile = buildProfileFromAuthUser(user);

  if (!hasSupabaseAdminEnv()) {
    return profile;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      avatar_url: profile.avatarUrl,
      city: profile.city,
      full_name: profile.fullName,
      id: profile.id,
      phone: profile.phone,
      role: profile.role,
      updated_at: profile.updatedAt,
    },
    { onConflict: "id" },
  );

  if (error) {
    return profile;
  }

  return profile;
}

export async function getStoredProfileById(profileId: string) {
  if (hasSupabaseAdminEnv()) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name, phone, city, avatar_url, role, created_at, updated_at")
      .eq("id", profileId)
      .maybeSingle<ProfileRow>();

    if (!error && data) {
      return mapProfileRow(data);
    }
  }

  return allUsers.find((user) => user.id === profileId) ?? null;
}

export async function updateProfileTable(
  userId: string,
  data: {
    fullName: string;
    phone: string;
    city: string;
    avatarUrl?: string | null;
  },
) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      avatar_url: data.avatarUrl ?? null,
      city: data.city,
      full_name: data.fullName,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return null;
  }

  return getStoredProfileById(userId);
}
