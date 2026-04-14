"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type EventCategory = "pageview" | "search" | "listing" | "action" | "error";
type EventAction = 
  | "view" 
  | "click_favorite" 
  | "remove_favorite"
  | "click_whatsapp" 
  | "search" 
  | "filter" 
  | "create_listing" 
  | "login" 
  | "register"
  | "error";

interface AnalyticsEvent {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, string | number | boolean>;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function isGAConfigured(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
}

export function trackEvent({ category, action, label, value, metadata }: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  
  const eventData: Record<string, string | number | undefined> = {
    event_category: category,
    event_action: action,
  };

  if (label) eventData.event_label = label;
  if (value) eventData.value = value;
  if (metadata) {
    Object.entries(metadata).forEach(([key, val]) => {
      eventData[key] = String(val);
    });
  }

  if (isGAConfigured()) {
    window.gtag("event", action, eventData);
  }
}

export function trackPageView(url: string, title?: string) {
  trackEvent({
    category: "pageview",
    action: "view",
    label: title || url,
    metadata: { url: url, title: title || "" },
  });
}

export function trackSearch(query: string, resultsCount: number) {
  trackEvent({
    category: "search",
    action: "search",
    label: query,
    value: resultsCount,
  });
}

export function trackListingClick(listingId: string, listingTitle: string, position: number) {
  trackEvent({
    category: "listing",
    action: "view",
    label: listingTitle,
    metadata: { listing_id: listingId, position },
  });
}

export function trackFavorite(listingId: string, action: "add" | "remove") {
  trackEvent({
    category: "listing",
    action: action === "add" ? "click_favorite" : "remove_favorite",
    metadata: { listing_id: listingId, action },
  });
}

export function trackWhatsAppClick(listingId: string, sellerId: string) {
  trackEvent({
    category: "listing",
    action: "click_whatsapp",
    metadata: { listing_id: listingId, seller_id: sellerId },
  });
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleRouteChange = useCallback(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");
    trackPageView(url);
  }, [pathname, searchParams]);

  useEffect(() => {
    handleRouteChange();
  }, [handleRouteChange]);

  return <>{children}</>;
}

export function initAnalytics() {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  
  window.gtag = function(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  
  window.gtag("js", new Date());
  window.gtag("config", "G-XXXXXXXXXX"); // Replace with actual GA4 ID
}