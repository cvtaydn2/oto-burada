"use client";

import { useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Heart, Search, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  { id: 1, type: 'favorite', title: 'İlanınız favorilere eklendi', message: '"Volkswagen Passat 1.6 TDi" ilanınız 3 kişi tarafından favoriye eklendi.', time: '2 saat önce', read: false },
  { id: 2, type: 'search', title: 'Kayıtlı aramanızda yeni sonuçlar', message: '"BMW 3 Serisi" aramanız için 5 yeni ilan eklendi.', time: '5 saat önce', read: false },
  { id: 3, type: 'system', title: 'İlanınız yayına alındı', message: '"Renault Megane 1.5 dCi" ilanınız onaylandı ve yayına alındı.', time: '1 gün önce', read: true },
  { id: 4, type: 'alert', title: 'İlan süreniz dolmak üzere', message: '"Honda Civic 1.6 i-VTEC" ilanınızın süresi 3 gün sonra dolacak.', time: '2 gün önce', read: true },
];

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredItems = showUnreadOnly ? items.filter(item => !item.read) : items;
  const unreadCount = items.filter(item => !item.read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'favorite': return <Heart className="size-5" />;
      case 'search': return <Search className="size-5" />;
      case 'system': return <CheckCircle2 className="size-5" />;
      case 'alert': return <AlertCircle className="size-5" />;
      default: return <Bell className="size-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'favorite': return "bg-rose-100 text-rose-600";
      case 'search': return "bg-sky-100 text-sky-600";
      case 'system': return "bg-emerald-100 text-emerald-600";
      case 'alert': return "bg-amber-100 text-amber-600";
      default: return "bg-indigo-100 text-indigo-600";
    }
  };

  const markAllAsRead = () => {
    setItems(items.map(item => ({ ...item, read: true })));
  };

  const deleteNotification = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-white border border-slate-200/60 p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Bildirimler</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} okunmamış bildiriminiz var
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all",
              showUnreadOnly 
                ? "bg-indigo-100 text-indigo-700" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {showUnreadOnly ? "Tümü" : "Okunmamış"}
          </button>
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-all"
          >
            <Check size={16} />
            Tümünü Oku
          </button>
        </div>
      </section>
      
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        {filteredItems.length > 0 ? (
          filteredItems.map((notif, idx) => {
            const isLast = idx === filteredItems.length - 1;
            
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex gap-4 p-5 transition-all hover:bg-slate-50 sm:p-6",
                  !isLast && "border-b border-slate-100",
                  !notif.read && "bg-indigo-50/50"
                )}
              >
                <div
                  className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", getIconColor(notif.type))}
                >
                  {getIconForType(notif.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-4">
                    <h4
                      className={cn(
                        "truncate pr-4 text-base",
                        !notif.read ? "font-bold text-slate-900" : "font-semibold text-slate-600"
                      )}
                    >
                      {notif.title}
                    </h4>
                    <span className="mt-1 shrink-0 whitespace-nowrap text-xs font-medium text-slate-400">
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{notif.message}</p>
                </div>
                <div className="flex items-start gap-2">
                  {!notif.read && (
                    <div className="mt-2 size-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="mt-1 p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Bell size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Bildirim yok</h3>
            <p className="text-slate-500">Yeni bildiriminiz olduğunda burada görünecek.</p>
          </div>
        )}
      </div>
    </div>
  );
}