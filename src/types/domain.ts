import type {
  expertInspectionGrades,
  expertInspectionStatuses,
  fuelTypes,
  listingSortOptions,
  listingStatuses,
  moderationActions,
  moderationTargetTypes,
  notificationTypes,
  reportReasons,
  reportStatuses,
  transmissionTypes,
  userRoles,
} from "@/lib/constants/domain";

export type UserRole = (typeof userRoles)[number];
export type ListingStatus = (typeof listingStatuses)[number];
export type FuelType = (typeof fuelTypes)[number];
export type TransmissionType = (typeof transmissionTypes)[number];
export type ReportReason = (typeof reportReasons)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type NotificationType = (typeof notificationTypes)[number];
export type ModerationTargetType = (typeof moderationTargetTypes)[number];
export type ModerationAction = (typeof moderationActions)[number];
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";
export type ListingSortOption = (typeof listingSortOptions)[number];

export type ExpertInspectionGrade = (typeof expertInspectionGrades)[number];
export type ExpertInspectionStatus = (typeof expertInspectionStatuses)[number];

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  role: UserRole;
  userType?: "individual" | "professional" | "staff";
  balanceCredits?: number;
  /**
   * General trust flag.
   */
  isVerified: boolean;
  isBanned?: boolean;
  banReason?: string | null;
  identityNumber?: string | null;
  restrictionState?: "active" | "restricted_review" | "banned";

  // Custom Trust Algorithm fields
  trustScore?: number;
  isWalletVerified?: boolean;

  // Corporate Fields
  businessName?: string | null;
  businessAddress?: string | null;
  businessLogoUrl?: string | null;
  businessDescription?: string | null;
  taxId?: string | null;
  taxOffice?: string | null;
  websiteUrl?: string | null;
  verifiedBusiness?: boolean;
  businessSlug?: string | null;

  // Verification Workflow
  verificationStatus?: VerificationStatus;
  verificationRequestedAt?: string | null;
  verificationReviewedAt?: string | null;
  verificationFeedback?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile extends Profile {
  userType: "professional";
  businessName: string;
}

export interface ListingImage {
  id?: string;
  listingId?: string | null;
  storagePath: string;
  url: string;
  order: number;
  isCover: boolean;
  placeholderBlur?: string | null;
  type?: "photo" | "video" | "360";
  thumbnailUrl?: string | null;
}

export interface Listing {
  id: string;
  slug: string;
  sellerId: string;
  title: string;
  brand: string;
  model: string;
  carTrim?: string | null;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  vin?: string | null;
  licensePlate?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  fraudScore?: number;
  fraudReason?: string | null;
  status: ListingStatus;
  images: ListingImage[];
  featured: boolean;
  featuredUntil?: string | null;
  urgentUntil?: string | null;
  highlightedUntil?: string | null;
  marketPriceIndex?: number | null;
  expertInspection?: ExpertInspection;
  seller?: Partial<Profile>;
  bumpedAt?: string | null;
  viewCount: number;
  /** Optimistic Concurrency version (Issue 5) */
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListingCreateInput {
  title: string;
  brand: string;
  model: string;
  carTrim?: string | null;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  vin: string;
  licensePlate?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  images: ListingImage[];
  expertInspection?: ExpertInspection;
}

export interface ListingCreateFormImage {
  fileName?: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  url?: string;
  placeholderBlur?: string | null;
  /** "360" marks this slot as an equirectangular panorama image */
  imageType?: "photo" | "360";
}

export interface ListingCreateFormValues {
  title: string;
  brand: string;
  model: string;
  carTrim?: string | null;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  vin: string;
  licensePlate?: string | null;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, string> | null;
  images: ListingCreateFormImage[];
  expertInspection?: ExpertInspection;
}

export interface Favorite {
  id?: string;
  userId: string;
  listingId: string;
  createdAt: string;
}

export interface SavedSearch {
  id?: string;
  userId: string;
  title: string;
  filters: ListingFilters;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearchCreateInput {
  title?: string;
  filters: ListingFilters;
  notificationsEnabled?: boolean;
}

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id?: string;
  listingId: string;
  reporterId: string;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ReportCreateInput {
  listingId: string;
  reason: ReportReason;
  description?: string | null;
}

export interface AdminModerationAction {
  id?: string;
  adminUserId: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  note?: string | null;
  createdAt: string;
}

export interface ListingFilters {
  query?: string;
  brand?: string;
  model?: string;
  carTrim?: string;
  city?: string;
  citySlug?: string;
  district?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  maxTramer?: number;
  hasExpertReport?: boolean;
  fuelType?: string;
  transmission?: string;
  sort?: ListingSortOption;
  page?: number;
  limit?: number;
  sellerId?: string;
  cursor?: string;
}

export interface ExpertInspection {
  hasInspection: boolean;
  inspectionDate?: string;
  overallGrade?: ExpertInspectionGrade;
  totalScore?: number;

  damageRecord?: ExpertInspectionStatus;
  bodyPaint?: ExpertInspectionStatus;
  engine?: ExpertInspectionStatus;
  transmission?: ExpertInspectionStatus;
  suspension?: ExpertInspectionStatus;
  brakes?: ExpertInspectionStatus;
  electrical?: ExpertInspectionStatus;
  interior?: ExpertInspectionStatus;
  tires?: ExpertInspectionStatus;
  acHeating?: ExpertInspectionStatus;

  notes?: string;
  inspectedBy?: string;
  documentUrl?: string; // Tramer/Ekspertiz Kanıt Dosyası
  documentPath?: string;
}

export const expertInspectionGradeInfo: {
  grade: ExpertInspectionGrade;
  label: string;
  color: string;
}[] = [
  { grade: "a", label: "A Mükemmel", color: "#22c55e" },
  { grade: "b", label: "B İyi", color: "#84cc16" },
  { grade: "c", label: "C Orta", color: "#eab308" },
  { grade: "d", label: "D Zayıf", color: "#f97316" },
  { grade: "e", label: "E Kötü", color: "#ef4444" },
];

export const expertInspectionStatusLabels: { status: ExpertInspectionStatus; label: string }[] = [
  { status: "var", label: "Değişmemiş" },
  { status: "yok", label: "Değişmiş/Onarılmış" },
  { status: "bilinmiyor", label: "Bilinmiyor" },
];

export interface Chat {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  lastMessageAt?: string;
  listing?: Partial<Listing>;
  buyer?: Partial<Profile>;
  seller?: Partial<Profile>;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
