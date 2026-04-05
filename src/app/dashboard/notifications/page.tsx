import { AlertCircle, Bell, CheckCircle2, Heart, Search } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    { id: 1, type: 'favorite', title: 'İlanınız favorilere eklendi', message: '"Volkswagen Passat 1.6 TDi" ilanınız 3 kişi tarafından favoriye eklendi.', time: '2 saat önce', read: false },
    { id: 2, type: 'search', title: 'Kayıtlı aramanızda yeni sonuçlar', message: '"BMW 3 Serisi" aramanız için 5 yeni ilan eklendi.', time: '5 saat önce', read: false },
    { id: 3, type: 'system', title: 'İlanınız yayına alındı', message: '"Renault Megane 1.5 dCi" ilanınız onaylandı ve yayına alındı.', time: '1 gün önce', read: true },
    { id: 4, type: 'alert', title: 'İlan süreniz dolmak üzere', message: '"Honda Civic 1.6 i-VTEC" ilanınızın süresi 3 gün sonra dolacak.', time: '2 gün önce', read: true },
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'favorite': return <Heart className="size-5 text-rose-500" />;
      case 'search': return <Search className="size-5 text-sky-500" />;
      case 'system': return <CheckCircle2 className="size-5 text-emerald-500" />;
      case 'alert': return <AlertCircle className="size-5 text-amber-500" />;
      default: return <Bell className="size-5 text-primary" />;
    }
  };

  const getBgForType = (type: string) => {
    switch (type) {
      case 'favorite': return "bg-rose-50";
      case 'search': return "bg-sky-50";
      case 'system': return "bg-emerald-50";
      case 'alert': return "bg-amber-50";
      default: return "bg-primary/10";
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bildirimler</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hesabınızla ilgili son gelişmeler ve önemli uyarılar.</p>
        </div>
        <button className="text-sm font-semibold text-primary transition-colors hover:text-primary/80">
          Tumunu Okundu Isaretle
        </button>
      </section>
      
      <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-background shadow-sm">
        {notifications.map((notif, idx) => {
          const isLast = idx === notifications.length - 1;
          
          return (
            <div
              key={notif.id}
              className={`flex gap-4 p-5 transition-colors hover:bg-muted/30 sm:p-6 ${
                !isLast ? 'border-b border-border/60' : ''
              } ${!notif.read ? 'bg-primary/5' : ''}`}
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-[1.25rem] ${getBgForType(notif.type)}`}
              >
                {getIconForType(notif.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-4">
                  <h4
                    className={`truncate pr-4 text-base ${
                      !notif.read ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  <span className="mt-1 shrink-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {notif.time}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{notif.message}</p>
              </div>
              {!notif.read && (
                <div className="mt-2 flex shrink-0">
                  <div className="size-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
