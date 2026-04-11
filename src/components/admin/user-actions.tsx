"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  MoreHorizontal, 
  ShieldCheck, 
  Ban, 
  UserCog, 
  Trash2,
  CheckCircle2,
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { banUser, verifyUserBusiness, updateUserRole } from "@/services/admin/users";

interface UserActionsProps {
  userId: string;
  userName: string;
  userType: string;
  isBanned?: boolean;
  isVerified?: boolean;
}

export function UserActions({ userId, userName, userType, isBanned, isVerified }: UserActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    setIsLoading(true);
    try {
      await action();
      toast.success(successMsg);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "İşlem başarısız oldu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
          <span className="sr-only">Menüyü aç</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yönetim: {userName}</DropdownMenuLabel>
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
            onClick={() => {
               const reason = window.prompt("Engelleme nedeni girin:");
               if (reason) handleAction(() => banUser(userId, reason), "Kullanıcı engellendi");
            }}
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

        <DropdownMenuItem className="gap-2 font-bold cursor-pointer text-slate-400 hover:text-red-600 transition-colors">
          <Trash2 size={16} />
          Hesabı Tamamen Sil
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
