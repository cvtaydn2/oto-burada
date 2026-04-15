"use client";

import { 
  User, 
  Calendar, 
  MoreHorizontal, 
  MessageCircle, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface TicketListProps {
  initialTickets: Ticket[];
}

export function TicketList({ initialTickets }: TicketListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (ticketId: string, status: string) => {
    setLoadingId(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Durum güncellendi");
      router.refresh();
    } catch {
      toast.error("Güncelleme başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="divide-y divide-slate-50">
      {initialTickets.map((ticket) => (
        <div key={ticket.id} className="p-6 hover:bg-slate-50/50 transition-colors group">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex gap-4">
                 <div className="size-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                    <MessageCircle size={24} />
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h4 className="text-sm font-black text-slate-800 tracking-tight">{ticket.subject}</h4>
                       <Badge className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border-none ${
                         ticket.priority === 'high' ? 'bg-rose-100 text-rose-600' : 
                         ticket.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 
                         'bg-blue-100 text-blue-600'
                       }`}>
                         {ticket.priority}
                       </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium italic line-clamp-1">{ticket.message}</p>
                    <div className="flex items-center gap-4 pt-1">
                       <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase italic">
                          <User size={12} className="text-slate-300" />
                          {ticket.profile?.full_name || "Misafir"}
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase italic">
                          <Calendar size={12} className="text-slate-300" />
                          {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                 <div className="flex flex-col items-end gap-1">
                    <Badge className={`rounded-xl h-8 px-4 flex items-center gap-2 border-none font-black text-[9px] uppercase tracking-widest italic ${
                      ticket.status === 'open' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' :
                      ticket.status === 'in_progress' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                       {ticket.status === 'open' && <AlertCircle size={10} />}
                       {ticket.status === 'resolved' && <CheckCircle2 size={10} />}
                       {ticket.status}
                    </Badge>
                 </div>
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button 
                         variant="ghost" 
                         className="h-10 w-10 p-0 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                         disabled={loadingId === ticket.id}
                       >
                          {loadingId === ticket.id 
                            ? <Loader2 className="h-5 w-5 animate-spin" />
                            : <MoreHorizontal className="h-5 w-5" />
                          }
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] rounded-2xl p-2 shadow-xl">
                       <DropdownMenuItem 
                         className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl"
                         onClick={() => handleStatusChange(ticket.id, "in_progress")}
                         disabled={ticket.status === "in_progress"}
                       >
                         İşleme Al
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl text-emerald-600"
                         onClick={() => handleStatusChange(ticket.id, "resolved")}
                         disabled={ticket.status === "resolved"}
                       >
                         Tamamlandı
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl text-slate-400"
                         onClick={() => handleStatusChange(ticket.id, "closed")}
                         disabled={ticket.status === "closed"}
                       >
                         Kapat
                       </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </div>
           </div>
        </div>
      ))}
      {initialTickets.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center gap-4">
           <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 text-slate-200">
              <MessageCircle size={40} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Henüz bir destek talebi bulunmuyor</p>
              <p className="text-xs text-slate-400 font-medium mt-1">İşler gayet yolunda görünüyor.</p>
           </div>
        </div>
      )}
    </div>
  );
}
