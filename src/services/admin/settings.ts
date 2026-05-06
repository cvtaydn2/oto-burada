"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { requireAdminUser } from "@/lib/auth/session";
import { logger } from "@/lib/logging/logger";
import { captureServerError, captureServerWarning } from "@/lib/monitoring/telemetry-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { PlatformSettings } from "./settings-types";
import { defaultPlatformSettings } from "./settings-types";

export type { PlatformSettings } from "./settings-types";

type PlatformSettingsKey = keyof PlatformSettings;
type PlatformSettingsValue = PlatformSettings[PlatformSettingsKey];

interface PlatformSettingRow {
  key: PlatformSettingsKey;
  value: PlatformSettingsValue;
}

export const getPlatformSettings = unstable_cache(
  async (): Promise<PlatformSettings> => {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value, updated_at");

      // Table may not exist yet — return defaults gracefully
      if (error) {
        logger.settings.error("platform_settings query failed", {
          code: error.code,
          message: error.message,
        });
        logger.settings.warn("platform_settings table not available, using defaults", {
          message: error.message,
          code: error.code,
        });
        captureServerWarning("platform_settings table not available", "settings", {
          code: error.code,
          message: error.message,
        });
        return defaultPlatformSettings;
      }

      const settings: Partial<PlatformSettings> = {};
      (data as PlatformSettingRow[] | null)?.forEach((item) => {
        if (item.key === "general_appearance") {
          settings.general_appearance = item.value as PlatformSettings["general_appearance"];
        }
        if (item.key === "moderation_policies") {
          settings.moderation_policies = item.value as PlatformSettings["moderation_policies"];
        }
        if (item.key === "notification_settings") {
          settings.notification_settings = item.value as PlatformSettings["notification_settings"];
        }
        if (item.key === "performance") {
          settings.performance = item.value as PlatformSettings["performance"];
        }
      });

      return {
        general_appearance: {
          ...defaultPlatformSettings.general_appearance,
          ...settings.general_appearance,
        },
        moderation_policies: {
          ...defaultPlatformSettings.moderation_policies,
          ...settings.moderation_policies,
        },
        notification_settings: {
          ...defaultPlatformSettings.notification_settings,
          ...settings.notification_settings,
        },
        performance: {
          ...defaultPlatformSettings.performance,
          ...settings.performance,
        },
      };
    } catch {
      return defaultPlatformSettings;
    }
  },
  ["platform-settings"],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ["platform-settings"],
  }
);

export async function updateAllPlatformSettings(
  settings: PlatformSettings
): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  try {
    const supabase = createSupabaseAdminClient();

    const updates = [
      {
        key: "general_appearance",
        value: settings.general_appearance,
        updated_at: new Date().toISOString(),
      },
      {
        key: "moderation_policies",
        value: settings.moderation_policies,
        updated_at: new Date().toISOString(),
      },
      {
        key: "notification_settings",
        value: settings.notification_settings,
        updated_at: new Date().toISOString(),
      },
      { key: "performance", value: settings.performance, updated_at: new Date().toISOString() },
    ];

    const { error } = await supabase
      .from("platform_settings")
      .upsert(updates, { onConflict: "key" });

    if (error) {
      if (error.code === "42P01") {
        return {
          success: false,
          error: "platform_settings tablosu henüz oluşturulmamış. Lütfen DB migration çalıştırın.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidateTag("platform-settings", "max");
    revalidatePath("/");
    revalidatePath("/favorites");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    logger.settings.error("updateAllPlatformSettings failed", err);
    captureServerError("updateAllPlatformSettings failed", "settings", err);
    return { success: false, error: message };
  }
}
