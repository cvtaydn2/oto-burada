"use client";

import { Ban, LoaderCircle, MoreVertical, ShieldCheck, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUser, promoteUserToAdmin, toggleUserBan } from "@/services/admin/users";

interface UserActionMenuProps {
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
}

export function UserActionMenu({ userId, isBanned, isAdmin }: UserActionMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleBanToggle = async () => {
    if (!userId) {
      toast.error("Kullanıcı ID'si bulunamadı.");
      return;
    }
    setIsLoading(true);
    try {
      await toggleUserBan(userId, isBanned);
      toast.success(
        isBanned ? "Kullanıcı yasaklaması kaldırıldı." : "Kullanıcı başarıyla yasaklandı."
      );
      router.refresh();
    } catch {
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
    } catch {
      toast.error("Yetkilendirme hatası.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await deleteUser(userId);
      toast.success("Kullanıcı hesabı silindi.");
      router.refresh();
    } catch {
      toast.error("Hesap silinemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className="rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <MoreVertical size={18} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 rounded-2xl border-slate-200 p-2 shadow-sm"
        >
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

          <DropdownMenuItem
            className="flex items-center gap-2 rounded-xl p-3 text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <UserMinus size={16} />
            Hesabı Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabı Kalıcı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kullanıcıyı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Kalıcı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
