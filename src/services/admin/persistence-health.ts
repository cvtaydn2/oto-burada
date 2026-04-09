import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseStorageEnv,
  hasSupabaseAdminEnv,
  hasSupabaseStorageEnv,
} from "@/lib/supabase/env";

interface TableHealth {
  count: number;
  key: string;
  label: string;
}

export interface PersistenceHealth {
  environment: {
    adminEnv: boolean;
    databaseUrlEnv: boolean;
    demoPasswordEnv: boolean;
    storageEnv: boolean;
  };
  message: string;
  ready: boolean;
  storage: {
    bucketAccessible: boolean | null;
    bucketName: string | null;
    message: string;
  };
  tables: TableHealth[];
}

interface StorageHealth {
  bucketAccessible: boolean | null;
  bucketName: string | null;
  message: string;
}

const tableDefinitions = [
  { key: "profiles", label: "Profiller" },
  { key: "listings", label: "Ilanlar" },
  { key: "listing_images", label: "Ilan gorselleri" },
  { key: "favorites", label: "Favoriler" },
  { key: "saved_searches", label: "Kayitli aramalar" },
  { key: "notifications", label: "Bildirimler" },
  { key: "reports", label: "Raporlar" },
  { key: "admin_actions", label: "Admin aksiyonlari" },
] as const;

export async function getPersistenceHealth(): Promise<PersistenceHealth> {
  const environment = {
    adminEnv: hasSupabaseAdminEnv(),
    databaseUrlEnv: Boolean(process.env.SUPABASE_DB_URL),
    demoPasswordEnv: Boolean(process.env.SUPABASE_DEMO_USER_PASSWORD),
    storageEnv: hasSupabaseStorageEnv(),
  };
  const storage: StorageHealth = {
    bucketAccessible: null,
    bucketName: environment.storageEnv ? getSupabaseStorageEnv().listingsBucket : null,
    message: environment.storageEnv
      ? "Bucket erisimi henuz kontrol edilmedi."
      : "Storage ortam degiskenleri eksik.",
  };

  if (!environment.adminEnv) {
    return {
      environment,
      message: "Supabase admin ortam degiskenleri eksik.",
      ready: false,
      storage,
      tables: [],
    };
  }

  const admin = createSupabaseAdminClient();
  if (environment.storageEnv && storage.bucketName) {
    const { data, error } = await admin.storage.getBucket(storage.bucketName);

    storage.bucketAccessible = !error && Boolean(data);
    storage.message = error
      ? `${storage.bucketName} bucket'i okunamadi: ${error.message}`
      : `${storage.bucketName} bucket'i erisilebilir durumda.`;
  }

  const results = await Promise.all(
    tableDefinitions.map(async (table) => {
      const { count, error } = await admin
        .from(table.key)
        .select("*", { count: "exact", head: true });

      if (error) {
        return {
          count: 0,
          error: error.message,
          key: table.key,
          label: table.label,
        };
      }

      return {
        count: count ?? 0,
        error: null,
        key: table.key,
        label: table.label,
      };
    }),
  );

  const failedTable = results.find((result) => result.error);

  if (failedTable) {
    return {
      environment,
      message: `${failedTable.label} tablosu okunamadi: ${failedTable.error}`,
      ready: false,
      storage,
      tables: results.map((result) => ({
        count: result.count,
        key: result.key,
        label: result.label,
      })),
    };
  }

  return {
    environment,
    message: "Supabase persistence tablolari erisilebilir durumda.",
    ready: true,
    storage,
    tables: results.map((result) => ({
      count: result.count,
      key: result.key,
      label: result.label,
    })),
  };
}
