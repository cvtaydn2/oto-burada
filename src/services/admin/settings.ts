"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("platform_settings").select("*");
  
  const settings: any = {};
  data?.forEach(item => {
    settings[item.key] = item.value;
  });
  
  return settings as PlatformSettings;
}

export async function updatePlatformSettings(key: string, value: any) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
    
  if (error) throw error;
  return { success: true };
}
