"use client";

import { Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { AdminSidebar } from "./admin-sidebar";

export function AdminMobileNav() {
  return (
    <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border bg-background sticky top-0 z-[60]">
      <Link href="/admin" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck size={16} />
        </div>
        <span className="text-xs font-bold tracking-tight uppercase">Admin</span>
      </Link>

      <Drawer direction="left">
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase h-10 border-slate-200"
          >
            <Menu size={16} />
            Menü
          </Button>
        </DrawerTrigger>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm" />
          <DrawerContent className="fixed inset-y-0 left-0 z-[80] flex w-[280px] flex-col bg-background shadow-2xl focus:outline-none">
            <div className="flex-1 overflow-y-auto">
              <div className="h-full">
                {/* We reuse the sidebar but remove its fixed/hidden classes for the drawer version */}
                <div className="flex flex-col h-full bg-card">
                  <AdminSidebar isMobile />
                </div>
              </div>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
}
