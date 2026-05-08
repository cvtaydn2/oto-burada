export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && url.startsWith("https") && anonKey && anonKey.length > 40);
}

export function hasSupabaseAdminEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && url.startsWith("https") && serviceRoleKey && serviceRoleKey.length > 100);
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
export function getSupabaseProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export function getRequiredAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;
  const ref = getSupabaseProjectRef();
  if (ref) return `https://${ref}.oto-burada.com`;
  return "http://localhost:3000";
}
