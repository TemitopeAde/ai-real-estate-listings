export const LISTINGS_COLLECTION_ID =
  "@admin14744/ai-real-estate-listings/listings";
export const SAVED_PROPERTIES_COLLECTION_ID =
  "@admin14744/ai-real-estate-listings/saved-properties";

export const LISTING_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "under_offer", label: "Under offer" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "sale", label: "For sale" },
  { value: "rent", label: "For rent" },
  { value: "lease", label: "For lease" },
] as const;

export const PROPERTY_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "land", label: "Land" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed-use", label: "Mixed-use" },
  { value: "other", label: "Other" },
] as const;

export const AREA_UNITS = [
  { value: "sq ft", label: "Square feet" },
  { value: "sq m", label: "Square metres" },
  { value: "acres", label: "Acres" },
] as const;

export const PROPERTY_CONDITIONS = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "needs_renovation", label: "Needs renovation" },
] as const;

export const FURNISHING_STATUSES = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "furnished", label: "Furnished" },
] as const;

export const TENURE_TYPES = [
  { value: "freehold", label: "Freehold" },
  { value: "leasehold", label: "Leasehold" },
] as const;

export const RENTAL_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number]["value"];
export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];
export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];
export type AreaUnit = (typeof AREA_UNITS)[number]["value"];
export type PropertyCondition = (typeof PROPERTY_CONDITIONS)[number]["value"];
export type FurnishingStatus = (typeof FURNISHING_STATUSES)[number]["value"];
export type TenureType = (typeof TENURE_TYPES)[number]["value"];
export type RentalFrequency = (typeof RENTAL_FREQUENCIES)[number]["value"];

export interface ListingImage {
  url: string;
  id?: string;
  title?: string;
}

export interface ListingViewEvent {
  viewerId?: string;
  viewerName?: string;
  viewerEmail?: string;
  viewedAt: Date;
}

export interface ListingInput {
  title: string;
  description?: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  status: ListingStatus;
  price: number;
  currency: string;
  area: number;
  areaUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  parkingSpaces?: number;
  furnished?: boolean;
  amenities?: string[];
  propertyCondition?: PropertyCondition;
  furnishingStatus?: FurnishingStatus;
  tenure?: TenureType;
  rentalFrequency?: RentalFrequency;
  availabilityDate?: Date;
  serviceCharge?: number;
  securityDeposit?: number;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  latitude?: number;
  longitude?: number;
  panoramaImage?: string;
  viewCount?: number;
  viewEvents?: ListingViewEvent[];
  address?: {
    country?: string;
    state?: string;
    subdivision?: string;
    city?: string;
    address?: string;
    streetAddress?: string;
    formatted?: string;
  };
  city: string;
  primaryImage?: string;
  gallery?: ListingImage[];
  aiDescription?: string;
  aiTags?: string[];
  aiGeneratedAt?: Date;
}

export interface Listing extends ListingInput {
  _id: string;
  _revision?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

export interface ListingQuery {
  search?: string;
  status?: ListingStatus;
  propertyType?: PropertyType;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface ListingPage {
  items: Listing[];
  totalCount: number;
  hasNext: boolean;
}

export interface DashboardSnapshot {
  total: number;
  active: number;
  underOffer: number;
  sold: number;
  recent: Listing[];
}

export interface AnalyticsSnapshot {
  total: number;
  aiReady: number;
  statusBreakdown: Array<{ label: string; value: number }>;
  propertyBreakdown: Array<{ label: string; value: number }>;
  transactionBreakdown: Array<{ label: string; value: number }>;
  activityByMonth: Array<{ label: string; value: number }>;
  topCities: Array<{ label: string; value: number }>;
  averagePriceByCurrency: Array<{
    currency: string;
    average: number;
    listings: number;
  }>;
}

function hasValue<T extends readonly { value: string }[]>(
  options: T,
  value: unknown,
): value is T[number]["value"] {
  return (
    typeof value === "string" &&
    options.some((option) => option.value === value)
  );
}

export function isListingStatus(value: unknown): value is ListingStatus {
  return hasValue(LISTING_STATUSES, value);
}

export function isTransactionType(value: unknown): value is TransactionType {
  return hasValue(TRANSACTION_TYPES, value);
}

export function isPropertyCondition(
  value: unknown,
): value is PropertyCondition {
  return hasValue(PROPERTY_CONDITIONS, value);
}

export function isFurnishingStatus(value: unknown): value is FurnishingStatus {
  return hasValue(FURNISHING_STATUSES, value);
}

export function isTenureType(value: unknown): value is TenureType {
  return hasValue(TENURE_TYPES, value);
}

export function isRentalFrequency(value: unknown): value is RentalFrequency {
  return hasValue(RENTAL_FREQUENCIES, value);
}

export function isPropertyType(value: unknown): value is PropertyType {
  return hasValue(PROPERTY_TYPES, value);
}

export function isAreaUnit(value: unknown): value is AreaUnit {
  return hasValue(AREA_UNITS, value);
}

export function getListingStatus(
  value: unknown,
  fallback: ListingStatus = "draft",
): ListingStatus {
  return isListingStatus(value) ? value : fallback;
}

export function getTransactionType(
  value: unknown,
  fallback: TransactionType = "sale",
): TransactionType {
  return isTransactionType(value) ? value : fallback;
}

export function getPropertyType(
  value: unknown,
  fallback: PropertyType = "other",
): PropertyType {
  return isPropertyType(value) ? value : fallback;
}

export function getAreaUnit(
  value: unknown,
  fallback: string = "sq ft",
): string {
  return isAreaUnit(value) ? value : fallback;
}
