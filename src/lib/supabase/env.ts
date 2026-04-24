export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function hasSupabaseStorageEnv() {
  return Boolean(hasSupabaseAdminEnv() && process.env.SUPABASE_STORAGE_BUCKET_LISTINGS);
}

export function hasSupabaseDocumentsStorageEnv() {
  return Boolean(hasSupabaseAdminEnv() && process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS);
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase yapılandırması eksik (URL veya Anon Key bulunamadı).");
  }
  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase Admin yapılandırması eksik (URL veya Service Role Key bulunamadı).");
  }
  return { serviceRoleKey, url };
}

export function getSupabaseStorageEnv() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  const listingsBucket = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS;
  if (!listingsBucket) {
    throw new Error("Supabase Storage yapılandırması eksik (Listings Bucket bulunamadı).");
  }
  return { listingsBucket, serviceRoleKey, url };
}

export function getSupabaseDocumentsStorageEnv() {
  const { serviceRoleKey, url } = getSupabaseAdminEnv();
  const documentsBucket = process.env.SUPABASE_STORAGE_BUCKET_DOCUMENTS;
  if (!documentsBucket) {
    throw new Error("Supabase Storage yapılandırması eksik (Documents Bucket bulunamadı).");
  }
  return { documentsBucket, serviceRoleKey, url };
}
