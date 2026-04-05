export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function hasSupabaseStorageEnv() {
  return Boolean(
    hasSupabaseAdminEnv() &&
      process.env.SUPABASE_STORAGE_BUCKET_LISTINGS,
  );
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase ortam değişkenleri eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY gereklidir.",
    );
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "Supabase admin ortam değişkenleri eksik. SUPABASE_SERVICE_ROLE_KEY gereklidir.",
    );
  }

  return { serviceRoleKey, url };
}

export function getSupabaseStorageEnv() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  const listingsBucket = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS;

  if (!listingsBucket) {
    throw new Error(
      "Supabase storage ortam değişkenleri eksik. SUPABASE_STORAGE_BUCKET_LISTINGS gereklidir.",
    );
  }

  return { listingsBucket, serviceRoleKey, url };
}
