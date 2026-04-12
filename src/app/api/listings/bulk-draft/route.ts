import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, message: "Geçersiz ID listesi" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("listings")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("seller_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "İlanlar taslağa çekildi." });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
