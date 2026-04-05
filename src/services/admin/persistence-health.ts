import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseAdminEnv, hasSupabaseStorageEnv } from "@/lib/supabase/env";

interface TableHealth {
  count: number;
  key: string;
  label: string;
}

export interface PersistenceHealth {
  environment: {
    adminEnv: boolean;
    storageEnv: boolean;
  };
  message: string;
  ready: boolean;
  tables: TableHealth[];
}

const tableDefinitions = [
  { key: "profiles", label: "Profiller" },
  { key: "listings", label: "Ilanlar" },
  { key: "listing_images", label: "Ilan gorselleri" },
  { key: "favorites", label: "Favoriler" },
  { key: "reports", label: "Raporlar" },
  { key: "admin_actions", label: "Admin aksiyonlari" },
] as const;

export async function getPersistenceHealth(): Promise<PersistenceHealth> {
  const environment = {
    adminEnv: hasSupabaseAdminEnv(),
    storageEnv: hasSupabaseStorageEnv(),
  };

  if (!environment.adminEnv) {
    return {
      environment,
      message: "Supabase admin ortam degiskenleri eksik.",
      ready: false,
      tables: [],
    };
  }

  const admin = createSupabaseAdminClient();
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
    tables: results.map((result) => ({
      count: result.count,
      key: result.key,
      label: result.label,
    })),
  };
}
