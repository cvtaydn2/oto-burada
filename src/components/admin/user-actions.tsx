"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MoreHorizontal, 
  ShieldCheck, 
  Ban, 
  UserCog, 
  Trash2,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { banUser, verifyUserBusiness, updateUserRole, deleteUser } from "@/services/admin/users";

interface UserActionsProps {
  userId: string;
  userName: string;
  userType: string;
  isBanned?: boolean;
  isVerified?: boolean;
}

export function UserActions({ userId, userName, userType, isBanned, isVerified }: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const router = useRouter();

  const handleAction = async (action: () => Promise<{ success: boolean }>, successMsg: string) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMsg);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "İşlem başarısız oldu";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Menüyü aç</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
          <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Yönetim: {userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {!isVerified && (
            <DropdownMenuItem 
              className="gap-2 font-bold cursor-pointer text-emerald-600 focus:text-emerald-700"
              onClick={() => handleAction(() => verifyUserBusiness(userId), "İşletme doğrulandı")}
            >
              <ShieldCheck size={16} />
              İşletmeyi Doğrula
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
              className="gap-2 font-bold cursor-pointer"
              onClick={() => handleAction(() => updateUserRole(userId, userType === "professional" ? "user" : "professional"), "Kullanıcı tipi güncellendi")}
          >
            <UserCog size={16} />
            {userType === "professional" ? "Bireysele Çevir" : "Galeriye Çevir"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {!isBanned ? (
            <DropdownMenuItem 
              className="gap-2 font-bold cursor-pointer text-rose-600 focus:text-rose-700"
              onClick={() => setBanDialogOpen(true)}
            >
              <Ban size={16} />
              Kullanıcıyı Engelle
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="gap-2 font-bold cursor-pointer text-slate-600 italic">
               <AlertCircle size={16} />
               Zaten Engelli
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            className="gap-2 font-bold cursor-pointer text-slate-400 hover:text-red-600 transition-colors"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 size={16} />
            Hesabı Tamamen Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı Engelle</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userName}</strong> kullanıcısını engellemek üzeresiniz. Engelleme nedenini girin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Engelleme nedeni..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="rounded-xl"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason("")}>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => {
                if (banReason.trim()) {
                  handleAction(() => banUser(userId, banReason.trim()), "Kullanıcı engellendi");
                  setBanReason("");
                } else {
                  toast.error("Engelleme nedeni boş olamaz.");
                }
              }}
            >
              Engelle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hesabı Kalıcı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{userName}</strong> kullanıcısının hesabını kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleAction(() => deleteUser(userId), "Kullanıcı hesabı silindi")}
            >
              Kalıcı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
