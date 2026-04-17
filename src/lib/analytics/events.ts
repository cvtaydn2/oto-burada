export enum AnalyticsEvent {
  // Navigation & General
  PAGE_VIEWED = "PAGE_VIEWED",
  
  // Auth
  USER_SIGNED_UP = "USER_SIGNED_UP",
  USER_LOGGED_IN = "USER_LOGGED_IN",
  USER_LOGGED_OUT = "USER_LOGGED_OUT",
  
  // Search
  SEARCH_PERFORMED = "SEARCH_PERFORMED",
  
  // Listings
  LISTING_VIEWED = "LISTING_VIEWED",
  LISTING_DRAFTED = "LISTING_DRAFTED",
  LISTING_SUBMITTED = "LISTING_SUBMITTED",
  LISTING_UPDATED = "LISTING_UPDATED",
  LISTING_FAVORITED = "LISTING_FAVORITED",
  
  // Listing Wizard
  LISTING_WIZARD_STARTED = "LISTING_WIZARD_STARTED",
  LISTING_WIZARD_STEP_COMPLETED = "LISTING_WIZARD_STEP_COMPLETED",
  LISTING_WIZARD_ABANDONED = "LISTING_WIZARD_ABANDONED",
  
  // Communication
  CHAT_STARTED = "CHAT_STARTED",
  WHATSAPP_CLICKED = "WHATSAPP_CLICKED",
  
  // Profiles & Business
  CORPORATE_APPLICATION_SUBMITTED = "CORPORATE_APPLICATION_SUBMITTED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
}

export interface EventProperties {
  [AnalyticsEvent.PAGE_VIEWED]: {
    path: string;
    url: string;
    search?: string;
  };
  
  [AnalyticsEvent.USER_SIGNED_UP]: {
    method: "email" | "oauth";
  };
  [AnalyticsEvent.USER_LOGGED_IN]: {
    method: "email" | "oauth";
  };
  [AnalyticsEvent.USER_LOGGED_OUT]: Record<string, never>;
  
  [AnalyticsEvent.SEARCH_PERFORMED]: {
    filters: Record<string, any>;
    resultCount: number;
    keyword?: string;
  };
  
  [AnalyticsEvent.LISTING_VIEWED]: {
    listingId: string;
    brand: string;
    model: string;
    year: number;
    price: number;
  };
  [AnalyticsEvent.LISTING_DRAFTED]: {
    draftId: string;
  };
  [AnalyticsEvent.LISTING_SUBMITTED]: {
    listingId: string;
    brand: string;
    model: string;
    price: number;
    fraudScore?: number;
  };
  [AnalyticsEvent.LISTING_UPDATED]: {
    listingId: string;
  };
  [AnalyticsEvent.LISTING_FAVORITED]: {
    listingId: string;
  };
  
  [AnalyticsEvent.LISTING_WIZARD_STARTED]: Record<string, never>;
  [AnalyticsEvent.LISTING_WIZARD_STEP_COMPLETED]: {
    stepName: string;
    stepIndex: number;
    timeSpentSeconds?: number;
  };
  [AnalyticsEvent.LISTING_WIZARD_ABANDONED]: {
    lastStepName: string;
  };
  
  [AnalyticsEvent.CHAT_STARTED]: {
    listingId: string;
    receiverId: string;
  };
  [AnalyticsEvent.WHATSAPP_CLICKED]: {
    listingId: string;
    sellerId: string;
  };
  
  [AnalyticsEvent.CORPORATE_APPLICATION_SUBMITTED]: {
    businessName: string;
    city: string;
  };
  [AnalyticsEvent.PROFILE_UPDATED]: {
    fieldsUpdated: string[];
  };
}

export type EventPayload<T extends AnalyticsEvent> = EventProperties[T];
