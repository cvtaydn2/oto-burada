import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { deleteDatabaseListing } from "@/services/listings/listing-submissions";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ success: false, message: "Geçersiz ID listesi." }, { status: 400 });
    }

    const results = await Promise.all(
      ids.map((id) => deleteDatabaseListing(id, user.id))
    );

    const successCount = results.filter(Boolean).length;

    return NextResponse.json({ 
      success: true, 
      message: `${successCount} ilan başarıyla silindi.`,
      count: successCount 
    });
  } catch (error: any) {
    console.error("Bulk Delete API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "İşlem sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
