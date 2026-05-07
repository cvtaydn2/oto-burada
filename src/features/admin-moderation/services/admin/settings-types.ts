// Platform settings types and defaults — no "use server" directive
// Importable from both client and server

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
  performance: {
    debug_mode: boolean;
  };
}

export const defaultPlatformSettings: PlatformSettings = {
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
  performance: {
    debug_mode: false,
  },
};
