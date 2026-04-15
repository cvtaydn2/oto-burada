"use client";

import { MoreVertical, Ban, ShieldCheck, UserMinus, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleUserBan, promoteUserToAdmin, deleteUser } from "@/services/admin/user_actions";
import { toast } from "sonner";

interface UserActionMenuProps {
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
}

export function UserActionMenu({ userId, isBanned, isAdmin }: UserActionMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBanToggle = async () => {
    if (!userId) {
      toast.error("Kullanıcı ID'si bulunamadı.");
      return;
    }
    setIsLoading(true);
    try {
      await toggleUserBan(userId, isBanned);
      toast.success(isBanned ? "Kullanıcı yasaklaması kaldırıldı." : "Kullanıcı başarıyla yasaklandı.");
      router.refresh();
    } catch (error) {
      console.error("Ban toggle error:", error);
      toast.error("İşlem gerçekleştirilemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!userId || isAdmin) return;
    setIsLoading(true);
    try {
      await promoteUserToAdmin(userId);
      toast.success("Kullanıcı admin olarak atandı.");
      router.refresh();
    } catch (error) {
      console.error("Promote error:", error);
      toast.error("Yetkilendirme hatası.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (!confirm("Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;
    setIsLoading(true);
    try {
      await deleteUser(userId);
      toast.success("Kullanıcı hesabı silindi.");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Hesap silinemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={isLoading}
          className="rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
        >
          {isLoading ? <LoaderCircle className="animate-spin" size={18} /> : <MoreVertical size={18} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200 p-2 shadow-xl">
        <DropdownMenuItem 
          onClick={handleBanToggle}
          className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <Ban size={16} className={isBanned ? "text-emerald-500" : "text-rose-500"} />
          {isBanned ? "Yasağı Kaldır" : "Kullanıcıyı Yasakla"}
        </DropdownMenuItem>
        
        {!isAdmin && (
           <DropdownMenuItem 
            onClick={handlePromote}
            className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
           >
            <ShieldCheck size={16} />
            Admin Yetkisi Ver
           </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        
        <DropdownMenuItem className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer" onClick={handleDelete}>
          <UserMinus size={16} />
          Hesabı Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
