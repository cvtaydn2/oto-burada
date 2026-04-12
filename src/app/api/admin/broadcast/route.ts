import { NextResponse } from "next/server";
import { requireApiAdminUser } from "@/lib/auth/api-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createDatabaseNotification, createDatabaseNotificationsBulk } from "@/services/notifications/notification-records";

export async function POST(request: Request) {
  const authResponse = await requireApiAdminUser();
  if (authResponse instanceof Response) return authResponse;

  try {
    const { title, message } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: { message: "Başlık ve mesaj zorunludur." } },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    
    // Get all users from profiles table
    const { data: profiles, error: fetchError } = await admin
      .from("profiles")
      .select("id");

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: { message: "Kullanıcı listesi alınamadı." } },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: "Gönderilecek kullanıcı bulunamadı." });
    }

    // Create notifications for all users in parallel batches
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
      const batch = profiles.slice(i, i + BATCH_SIZE);
      await createDatabaseNotificationsBulk(
        batch.map(profile => ({
          userId: profile.id,
          type: "system",
          title,
          message,
          href: "/"
        }))
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `${profiles.length} kullanıcıya duyuru başarıyla gönderildi.` 
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Duyuru gönderilirken bir hata oluştu." } },
      { status: 500 }
    );
  }
}
