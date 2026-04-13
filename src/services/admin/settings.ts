"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PlatformSettings {
  general_appearance: {
    site_title: string;
    support_email: string;
    maintenance_mode: boolean;
  };
  moderation_policies: {
    auto_approve_regulars: boolean;
    vin_check_enabled: boolean;
    max_free_listings: number;
  };
  notification_settings: {
    new_listing_slack: boolean;
    report_email_alerts: boolean;
  };
}

type PlatformSettingsKey = keyof PlatformSettings;
type PlatformSettingsValue = PlatformSettings[PlatformSettingsKey];

interface PlatformSettingRow {
  key: PlatformSettingsKey;
  value: PlatformSettingsValue;
}

const defaultPlatformSettings: PlatformSettings = {
  general_appearance: {
    site_title: "OtoBurada",
    support_email: "destek@otoburada.com",
    maintenance_mode: false,
  },
  moderation_policies: {
    auto_approve_regulars: false,
    vin_check_enabled: false,
    max_free_listings: 3,
  },
  notification_settings: {
    new_listing_slack: false,
    report_email_alerts: true,
  },
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("platform_settings").select("*");

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
  };
}

export async function updatePlatformSettings<K extends PlatformSettingsKey>(
  key: K,
  value: PlatformSettings[K],
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
    
  if (error) throw error;
  return { success: true };
}
