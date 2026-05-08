"use client";

import { Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
} from "@/features/ui/components/drawer";

import { AdminSidebar } from "./admin-sidebar";

export function AdminMobileNav() {
  return (
    <div className="sticky top-0 z-[60] border-b border-border bg-background/95 backdrop-blur md:hidden">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold uppercase tracking-[0.18em] text-foreground">
              Admin Kontrol
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Moderasyon ve güvenlik yüzeyleri
            </span>
          </div>
        </Link>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-2xl border-border bg-background px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground"
            >
              <Menu size={16} />
              Menü
            </Button>
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" />
            <DrawerContent className="fixed inset-y-0 left-0 z-[80] flex w-[min(90vw,320px)] flex-col bg-background shadow-2xl focus:outline-none">
              <div className="border-b border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-foreground">
                      Hızlı admin erişimi
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Moderasyon, rapor ve audit yüzeyleri tek çekmecede.
                    </p>
                  </div>
                  <Badge className="rounded-full border-none bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    Mobil
                  </Badge>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar isMobile />
              </div>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      </div>
    </div>
  );
}
