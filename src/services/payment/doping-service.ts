import { DOPING_PACKAGES } from "@/lib/constants/doping";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class DopingService {
  /**
   * Applies a doping package to a listing.
   * This is typically called after a successful payment.
   */
  static async applyDoping(params: {
    userId: string;
    listingId: string;
    packageId: string;
    paymentId?: string;
  }) {
    const admin = createSupabaseAdminClient();
    const pkg = DOPING_PACKAGES.find((p) => p.id === params.packageId);

    if (!pkg) throw new Error("Invalid doping package");

    const startsAt = new Date();
    const expiresAt =
      pkg.durationDays > 0
        ? new Date(startsAt.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000)
        : null;

    // 1. Create doping purchase record
    const { data: purchase, error: purchaseError } = await admin
      .from("doping_purchases")
      .insert({
        user_id: params.userId,
        listing_id: params.listingId,
        package_id: (await this.getDbPackageId(pkg.id)) || null, // We need to map slug to UUID
        payment_id: params.paymentId,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt?.toISOString(),
      })
      .select()
      .single();

    if (purchaseError) throw new Error(`Doping purchase error: ${purchaseError.message}`);

    // 2. Update listing columns based on doping type
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    switch (pkg.type) {
      case "featured":
        updateData.featured = true;
        updateData.is_featured = true;
        updateData.featured_until = expiresAt?.toISOString();
        break;
      case "urgent":
        updateData.is_urgent = true;
        updateData.urgent_until = expiresAt?.toISOString();
        break;
      case "highlighted":
        updateData.highlighted_until = expiresAt?.toISOString();
        updateData.frame_color = "orange"; // Example
        break;
      case "gallery":
        updateData.gallery_priority = 10;
        break;
      case "bump":
        updateData.bumped_at = new Date().toISOString();
        break;
    }

    const { error: listingError } = await admin
      .from("listings")
      .update(updateData)
      .eq("id", params.listingId);

    if (listingError) throw new Error(`Listing update error: ${listingError.message}`);

    return purchase;
  }

  /**
   * Helper to map package slug (id in DOPING_PACKAGES) to DB UUID
   */
  private static async getDbPackageId(slug: string): Promise<string | null> {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("doping_packages").select("id").eq("slug", slug).single();

    return data?.id || null;
  }
}
