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
} from "@/features/shared/lib/domain";
import type { VehicleCategory } from "@/features/shared/lib/vehicle-categories";

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
export type { VehicleCategory };

export type ExpertInspectionGrade = (typeof expertInspectionGrades)[number];
export type ExpertInspectionStatus = (typeof expertInspectionStatuses)[number];

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
  id: string;
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
  isExchange?: boolean;
  featured?: boolean;
  galleryPriority?: number;
  validationError?: string;
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
