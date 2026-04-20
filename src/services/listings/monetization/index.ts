import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Handles monetization logic related to listings, such as featured status and dopings.
 */

export interface DopingApplication {
  listingId: string;
  type: 'featured' | 'urgent' | 'highlighted';
  durationDays: number;
}

export async function applyDoping(application: DopingApplication) {
  const admin = createSupabaseAdminClient();
  const until = new Date();
  until.setDate(until.getDate() + application.durationDays);

  const updateMap: Record<string, any> = {
    updated_at: new Date().toISOString()
  };

  if (application.type === 'featured') {
    updateMap.featured = true;
    updateMap.featured_until = until.toISOString();
  } else if (application.type === 'urgent') {
    updateMap.urgent_until = until.toISOString();
  } else if (application.type === 'highlighted') {
    updateMap.highlighted_until = until.toISOString();
  }

  const { error } = await admin
    .from("listings")
    .update(updateMap)
    .eq("id", application.listingId);

  return !error;
}
