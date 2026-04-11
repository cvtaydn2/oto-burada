import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Profile } from "@/types/domain";

export async function getAllUsers() {
  const supabase = await createSupabaseServerClient();
  
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all users:", error);
    return [];
  }

  return profiles as Profile[];
}

export async function updateUserRole(userId: string, role: "user" | "admin" | "professional") {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ user_type: role })
    .eq("id", userId);

  if (error) throw new Error(`Rol güncellenemed: ${error.message}`);
  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  
  // In a real app we might have a 'banned' boolean or status column
  const { error } = await supabase
    .from("profiles")
    .update({ 
       is_banned: true,
       ban_reason: reason 
    } as any) // Assuming these columns might need to be added or handled gracefully
    .eq("id", userId);

  if (error) throw new Error(`Kullanıcı engellenemedi: ${error.message}`);
  return { success: true };
}

export async function verifyUserBusiness(userId: string) {
  const supabase = await createSupabaseServerClient();
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
       verified_business: true 
    } as any)
    .eq("id", userId);

  if (error) throw new Error(`İşletme doğrulanamadı: ${error.message}`);
  return { success: true };
}
