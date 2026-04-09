import type {
  fuelTypes,
  listingSortOptions,
  listingStatuses,
  moderationActions,
  moderationTargetTypes,
  reportReasons,
  reportStatuses,
  notificationTypes,
  transmissionTypes,
  userRoles,
  expertInspectionGrades,
  expertInspectionStatuses,
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
export type ListingSortOption = (typeof listingSortOptions)[number];
export type ExpertInspectionGrade = (typeof expertInspectionGrades)[number];
export type ExpertInspectionStatus = (typeof expertInspectionStatuses)[number];

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ListingImage {
  id?: string;
  listingId?: string | null;
  storagePath: string;
  url: string;
  order: number;
  isCover: boolean;
}

export interface Listing {
  id: string;
  slug: string;
  sellerId: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, any> | null;
  fraudScore?: number;
  fraudReason?: string | null;
  status: ListingStatus;
  images: ListingImage[];
  featured: boolean;
  expertInspection?: ExpertInspection;
  bumpedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingCreateInput {
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, any> | null;
  images: ListingImage[];
  expertInspection?: ExpertInspection;
}

export interface ListingCreateFormImage {
  fileName?: string;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  url?: string;
}

export interface ListingCreateFormValues {
  title: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  price: number;
  city: string;
  district: string;
  description: string;
  whatsappPhone: string;
  tramerAmount?: number | null;
  damageStatusJson?: Record<string, any> | null;
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
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  sort?: ListingSortOption;
  page?: number;
  limit?: number;
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
}

export const expertInspectionGradeInfo: { grade: ExpertInspectionGrade; label: string; color: string }[] = [
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
