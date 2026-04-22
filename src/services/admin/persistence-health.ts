"use server";

import { Redis } from "@upstash/redis";

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

interface RedisStats {
  uptime: string | null;
  memory: string | null;
  clients: string | null;
  version: string | null;
}

export interface PersistenceHealth {
  environment: {
    adminEnv: boolean;
    databaseUrlEnv: boolean;
    demoPasswordEnv: boolean;
    storageEnv: boolean;
    redisEnv: boolean;
  };
  healthScore: number;
  message: string;
  ready: boolean;
  storage: {
    bucketAccessible: boolean | null;
    bucketName: string | null;
    message: string;
  };
  redis: {
    uptime: string | null;
    memory: string | null;
    clients: string | null;
    version: string | null;
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
    redisEnv: Boolean(process.env.UPSTASH_REDIS_REST_URL),
  };

  const storage: StorageHealth = {
    bucketAccessible: null,
    bucketName: environment.storageEnv ? getSupabaseStorageEnv().listingsBucket : null,
    message: environment.storageEnv
      ? "Bucket erisimi henuz kontrol edilmedi."
      : "Storage ortam degiskenleri eksik.",
  };

  let checksCount = 0;
  let successCount = 0;

  const redisStats: RedisStats = {
    uptime: null,
    memory: null,
    clients: null,
    version: null,
  };

  // Check 1: Admin API
  checksCount++;
  if (environment.adminEnv) successCount++;

  // Check 2: Redis
  checksCount++;
  if (environment.redisEnv) {
    try {
      const redis = Redis.fromEnv();
      const [ping, info] = await Promise.all([
        redis.ping(),
        (redis as unknown as { info: () => Promise<string> }).info(),
      ]);

      if (ping === "PONG") {
        successCount++;

        // Parse basic info (Upstash returns a string)
        if (typeof info === "string") {
          const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
          const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
          const clientsMatch = info.match(/connected_clients:(\d+)/);
          const versionMatch = info.match(/redis_version:([^\r\n]+)/);

          if (uptimeMatch) {
            const seconds = parseInt(uptimeMatch[1]);
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            redisStats.uptime = `${days}g ${hours}s`;
          }
          if (memoryMatch) redisStats.memory = memoryMatch[1];
          if (clientsMatch) redisStats.clients = clientsMatch[1];
          if (versionMatch) redisStats.version = versionMatch[1];
        }
      }
    } catch {
      // Failed redis check
    }
  }

  if (!environment.adminEnv) {
    return {
      environment,
      healthScore: (successCount / checksCount) * 100,
      message: "Supabase admin ortam degiskenleri eksik.",
      ready: false,
      storage,
      redis: redisStats,
      tables: [],
    };
  }

  const admin = createSupabaseAdminClient();

  // Check 3: Storage
  checksCount++;
  if (environment.storageEnv && storage.bucketName) {
    const { data, error } = await admin.storage.getBucket(storage.bucketName);
    storage.bucketAccessible = !error && Boolean(data);
    if (storage.bucketAccessible) successCount++;
    storage.message = error
      ? `${storage.bucketName} bucket'i okunamadi: ${error.message}`
      : `${storage.bucketName} bucket'i erisilebilir durumda.`;
  }

  const results = await Promise.all(
    tableDefinitions.map(async (table) => {
      const { count, error } = await admin
        .from(table.key)
        .select("*", { count: "exact", head: true });

      return {
        count: count ?? 0,
        error: error ? error.message : null,
        key: table.key,
        label: table.label,
      };
    })
  );

  // Check 4: Tables
  checksCount += tableDefinitions.length;
  successCount += results.filter((r) => !r.error).length;

  const healthScore = Math.round((successCount / checksCount) * 100);
  const failedTable = results.find((result) => result.error);

  return {
    environment,
    healthScore,
    message: failedTable
      ? `${failedTable.label} tablosu okunamadi: ${failedTable.error}`
      : "Sistem bileşenleri sağlıklı şekilde çalışıyor.",
    ready: !failedTable && environment.adminEnv,
    storage,
    redis: redisStats,
    tables: results.map((result) => ({
      count: result.count,
      key: result.key,
      label: result.label,
    })),
  };
}
