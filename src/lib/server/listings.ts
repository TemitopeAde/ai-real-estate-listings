import { items } from "@wix/data";

import {
  getAreaUnit,
  getListingStatus,
  getPropertyType,
  getTransactionType,
  isPropertyCondition,
  isFurnishingStatus,
  isTenureType,
  isRentalFrequency,
  LISTINGS_COLLECTION_ID,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  type AnalyticsSnapshot,
  type DashboardSnapshot,
  type Listing,
  type ListingInput,
  type ListingImage,
  type ListingViewEvent,
  type ListingPage,
  type ListingQuery,
} from "@/lib/listing-types";

type WixDataRecord = { _id?: string; [key: string]: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function toDateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

function toAddress(value: unknown): { formatted?: string } | undefined {
  if (!isRecord(value)) return undefined;

  const formatted = toStringValue(value.formatted);
  return formatted ? { formatted } : undefined;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toGallery(value: unknown): ListingImage[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const gallery = value.flatMap((image): ListingImage[] => {
    if (typeof image === "string" && image.trim())
      return [{ url: image.trim() }];
    if (!isRecord(image) || typeof image.url !== "string" || !image.url.trim())
      return [];

    const result: ListingImage = { url: image.url.trim() };
    if (typeof image.id === "string" && image.id.trim())
      result.id = image.id.trim();
    if (typeof image._id === "string" && image._id.trim())
      result.id = image._id.trim();
    if (typeof image.title === "string" && image.title.trim())
      result.title = image.title.trim();
    if (typeof image.displayName === "string" && image.displayName.trim())
      result.title = image.displayName.trim();
    return [result];
  });

  return gallery.length > 0 ? gallery : undefined;
}

function toViewEvents(value: unknown): ListingViewEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((event): ListingViewEvent[] => {
    if (!isRecord(event)) return [];
    const viewedAt = toDateValue(event.viewedAt);
    if (!viewedAt) return [];
    const result: ListingViewEvent = { viewedAt };
    if (typeof event.viewerId === "string" && event.viewerId.trim())
      result.viewerId = event.viewerId.trim();
    if (typeof event.viewerName === "string" && event.viewerName.trim())
      result.viewerName = event.viewerName.trim();
    if (typeof event.viewerEmail === "string" && event.viewerEmail.trim())
      result.viewerEmail = event.viewerEmail.trim();
    return [result];
  });
}

export function normalizeListing(item: WixDataRecord): Listing {
  return {
    _id: item._id ?? "",
    _createdDate: toDateValue(item._createdDate),
    _updatedDate: toDateValue(item._updatedDate),
    title: toStringValue(item.title) ?? "Untitled listing",
    description: toStringValue(item.description),
    transactionType: getTransactionType(item.transactionType),
    propertyType: getPropertyType(item.propertyType),
    status: getListingStatus(item.status),
    price: toNumberValue(item.price) ?? 0,
    currency: toStringValue(item.currency) ?? "USD",
    area: toNumberValue(item.area) ?? 0,
    areaUnit: getAreaUnit(item.areaUnit),
    bedrooms: toNumberValue(item.bedrooms),
    bathrooms: toNumberValue(item.bathrooms),
    yearBuilt: toNumberValue(item.yearBuilt),
    parkingSpaces: toNumberValue(item.parkingSpaces),
    furnished: typeof item.furnished === "boolean" ? item.furnished : undefined,
    amenities: toStringArray(item.amenities),
    propertyCondition: isPropertyCondition(item.propertyCondition)
      ? item.propertyCondition
      : undefined,
    furnishingStatus: isFurnishingStatus(item.furnishingStatus)
      ? item.furnishingStatus
      : undefined,
    tenure: isTenureType(item.tenure) ? item.tenure : undefined,
    rentalFrequency: isRentalFrequency(item.rentalFrequency)
      ? item.rentalFrequency
      : undefined,
    availabilityDate: toDateValue(item.availabilityDate),
    serviceCharge: toNumberValue(item.serviceCharge),
    securityDeposit: toNumberValue(item.securityDeposit),
    agentName: toStringValue(item.agentName),
    agentPhone: toStringValue(item.agentPhone),
    agentEmail: toStringValue(item.agentEmail),
    latitude: toNumberValue(item.latitude),
    longitude: toNumberValue(item.longitude),
    virtualTourUrl: toStringValue(item.virtualTourUrl),
    viewCount: toNumberValue(item.viewCount) ?? 0,
    viewEvents: toViewEvents(item.viewEvents),
    address: toAddress(item.address),
    city: toStringValue(item.city) ?? "",
    primaryImage: toStringValue(item.primaryImage),
    gallery: toGallery(item.gallery),
    aiDescription: toStringValue(item.aiDescription),
    aiTags: toStringArray(item.aiTags),
    aiGeneratedAt: toDateValue(item.aiGeneratedAt),
  };
}

function withoutEmptyValues(input: ListingInput): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") result[key] = value;
  }

  return result;
}

export function listingToInput(listing: Listing): ListingInput {
  return {
    title: listing.title,
    description: listing.description,
    transactionType: listing.transactionType,
    propertyType: listing.propertyType,
    status: listing.status,
    price: listing.price,
    currency: listing.currency,
    area: listing.area,
    areaUnit: listing.areaUnit,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    yearBuilt: listing.yearBuilt,
    parkingSpaces: listing.parkingSpaces,
    furnished: listing.furnished,
    amenities: listing.amenities,
    propertyCondition: listing.propertyCondition,
    furnishingStatus: listing.furnishingStatus,
    tenure: listing.tenure,
    rentalFrequency: listing.rentalFrequency,
    availabilityDate: listing.availabilityDate,
    serviceCharge: listing.serviceCharge,
    securityDeposit: listing.securityDeposit,
    agentName: listing.agentName,
    agentPhone: listing.agentPhone,
    agentEmail: listing.agentEmail,
    latitude: listing.latitude,
    longitude: listing.longitude,
    virtualTourUrl: listing.virtualTourUrl,
    viewCount: listing.viewCount,
    viewEvents: listing.viewEvents,
    address: listing.address,
    city: listing.city,
    primaryImage: listing.primaryImage,
    gallery: listing.gallery,
    aiDescription: listing.aiDescription,
    aiTags: listing.aiTags,
    aiGeneratedAt: listing.aiGeneratedAt,
  };
}

export async function queryListings(
  queryOptions: ListingQuery = {},
): Promise<ListingPage> {
  const page = Math.max(0, queryOptions.page ?? 0);
  const pageSize = Math.min(100, Math.max(1, queryOptions.pageSize ?? 10));
  const query = items.query(LISTINGS_COLLECTION_ID);
  const search = queryOptions.search?.trim();

  if (search) {
    const titleFilter = items.filter().contains("title", search);
    const cityFilter = items.filter().contains("city", search);
    query.or(titleFilter).or(cityFilter);
  }

  if (queryOptions.status) {
    query.eq("status", queryOptions.status);
  } else if (!queryOptions.includeArchived) {
    query.ne("status", "archived");
  }

  if (queryOptions.propertyType) {
    query.eq("propertyType", queryOptions.propertyType);
  }

  const result = await query
    .descending("_updatedDate")
    .skip(page * pageSize)
    .limit(pageSize)
    .find({ returnTotalCount: true });

  return {
    items: result.items.map(normalizeListing),
    totalCount: result.totalCount ?? result.items.length,
    hasNext: result.hasNext(),
  };
}

export async function getListing(id: string): Promise<Listing | null> {
  const item = await items.get(LISTINGS_COLLECTION_ID, id);
  return item ? normalizeListing(item) : null;
}

export async function saveListing(
  input: ListingInput,
  id?: string,
): Promise<Listing> {
  const data = withoutEmptyValues(input);
  const result = id
    ? await items.update(LISTINGS_COLLECTION_ID, { _id: id, ...data })
    : await items.insert(LISTINGS_COLLECTION_ID, data);

  return normalizeListing(result);
}

export async function updateListing(
  id: string,
  patch: Partial<ListingInput>,
): Promise<Listing | null> {
  const listing = await getListing(id);
  if (!listing) return null;

  return saveListing({ ...listingToInput(listing), ...patch }, id);
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [total, active, underOffer, sold, recent] = await Promise.all([
    items.query(LISTINGS_COLLECTION_ID).count(),
    items.query(LISTINGS_COLLECTION_ID).eq("status", "active").count(),
    items.query(LISTINGS_COLLECTION_ID).eq("status", "under_offer").count(),
    items.query(LISTINGS_COLLECTION_ID).eq("status", "sold").count(),
    queryListings({ pageSize: 5, includeArchived: true }),
  ]);

  return { total, active, underOffer, sold, recent: recent.items };
}

async function getAllListings(): Promise<Listing[]> {
  const all: Listing[] = [];
  let result = await items
    .query(LISTINGS_COLLECTION_ID)
    .ascending("_createdDate")
    .limit(1000)
    .find();

  all.push(...result.items.map(normalizeListing));

  while (result.hasNext()) {
    result = await result.next();
    all.push(...result.items.map(normalizeListing));
  }

  return all;
}

function incrementCount(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function mapToBreakdown(
  counts: Map<string, number>,
  labelFor: (key: string) => string,
): Array<{ label: string; value: number }> {
  return [...counts.entries()]
    .sort(([, first], [, second]) => second - first)
    .map(([key, value]) => ({ label: labelFor(key), value }));
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const listings = await getAllListings();
  const statusCounts = new Map<string, number>();
  const propertyCounts = new Map<string, number>();
  const transactionCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  const currencyPrices = new Map<string, { total: number; count: number }>();
  const activityCounts = new Map<string, number>();

  for (const listing of listings) {
    incrementCount(statusCounts, listing.status);
    incrementCount(propertyCounts, listing.propertyType);
    incrementCount(transactionCounts, listing.transactionType);
    if (listing.city) incrementCount(cityCounts, listing.city);

    const currency = listing.currency.toUpperCase();
    const currencyData = currencyPrices.get(currency) ?? { total: 0, count: 0 };
    currencyData.total += listing.price;
    currencyData.count += 1;
    currencyPrices.set(currency, currencyData);

    const createdDate = listing._createdDate ?? listing._updatedDate;
    if (createdDate) incrementCount(activityCounts, monthKey(createdDate));
  }

  const now = new Date();
  const activityByMonth = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      label: date.toLocaleDateString(undefined, { month: "short" }),
      value: activityCounts.get(monthKey(date)) ?? 0,
    };
  });

  return {
    total: listings.length,
    aiReady: listings.filter(
      (listing) =>
        Boolean(listing.aiDescription) || (listing.aiTags?.length ?? 0) > 0,
    ).length,
    statusBreakdown: mapToBreakdown(
      statusCounts,
      (key) =>
        LISTING_STATUSES.find((option) => option.value === key)?.label ?? key,
    ),
    propertyBreakdown: mapToBreakdown(
      propertyCounts,
      (key) =>
        PROPERTY_TYPES.find((option) => option.value === key)?.label ?? key,
    ),
    transactionBreakdown: mapToBreakdown(
      transactionCounts,
      (key) =>
        TRANSACTION_TYPES.find((option) => option.value === key)?.label ?? key,
    ),
    activityByMonth,
    topCities: mapToBreakdown(cityCounts, (key) => key).slice(0, 5),
    averagePriceByCurrency: [...currencyPrices.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([currency, data]) => ({
        currency,
        average: data.count > 0 ? data.total / data.count : 0,
        listings: data.count,
      })),
  };
}
