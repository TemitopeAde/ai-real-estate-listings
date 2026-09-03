import { items } from "@wix/data";
import { auth } from "@wix/essentials";

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
  type ListingPriceRange,
  type ListingQuery,
} from "@/lib/listing-types";
import { normalizeRichText } from "@/lib/server/listing-validation";
import {
  applyPublicListingGates,
  getAppEntitlement,
} from "@/lib/server/entitlement";
import { getSiteOwnerContact } from "@/lib/server/site-owner";
import type { AppEntitlement } from "@/lib/entitlement";

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

  if (isRecord(value)) {
    return toDateValue(value.$date ?? value.date ?? value.value);
  }

  return undefined;
}

function streetAddressLine(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!isRecord(value)) return undefined;
  const name =
    toStringValue(value.name) ?? toStringValue(value.formattedAddressLine);
  const rawNumber = value.number;
  const number =
    typeof rawNumber === "number" && Number.isFinite(rawNumber)
      ? String(rawNumber)
      : toStringValue(rawNumber);
  const combined = [number, name].filter(Boolean).join(" ").trim();
  return combined || toStringValue(value.formatted);
}

function cityFromFormatted(formatted: string | undefined, state?: string, country?: string): string | undefined {
  if (!formatted) return undefined;
  const ignored = new Set(
    [state, country].flatMap((value) =>
      value ? [value.trim().toLowerCase(), value.trim().toLowerCase().replace(/\s+state$/, "")] : [],
    ),
  );
  const parts = formatted
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return undefined;
  const candidate = parts.find((part, index) => {
    if (index === 0) return false;
    const normalized = part.toLowerCase().replace(/\s+state$/, "");
    return !ignored.has(part.toLowerCase()) && !ignored.has(normalized);
  });
  return candidate;
}

function toAddress(value: unknown): Listing["address"] {
  if (!isRecord(value)) return undefined;

  const formatted = toStringValue(value.formatted) ?? toStringValue(value.formattedAddress);
  const parsed = partsFromFormatted(formatted);
  const country =
    toStringValue(value.country) ?? parsed.country;
  const state =
    toStringValue(value.state) ??
    toStringValue(value.subdivision) ??
    parsed.state;
  const address =
    toStringValue(value.address) ?? streetAddressLine(value.streetAddress) ?? parsed.address;
  const city =
    toStringValue(value.city) ??
    parsed.city ??
    cityFromFormatted(formatted, state, country);
  if (!country && !state && !city && !address && !formatted) return undefined;
  return { country, state, subdivision: state, city, address, streetAddress: address, formatted };
}

function partsFromFormatted(formatted: string | undefined): {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
} {
  if (!formatted) return {};
  const parts = formatted
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 4) {
    return {
      address: parts.slice(0, parts.length - 3).join(", "),
      city: parts[parts.length - 3],
      state: parts[parts.length - 2],
      country: parts[parts.length - 1],
    };
  }
  if (parts.length === 3) {
    return {
      city: parts[0],
      state: parts[1],
      country: parts[2],
    };
  }
  return {};
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

function mergePanoramas(
  images: ListingImage[] | undefined,
  fallback?: string,
): ListingImage[] | undefined {
  const list = [...(images ?? [])];
  if (fallback && !list.some((image) => image.url === fallback)) {
    list.unshift({ url: fallback });
  }
  return list.length > 0 ? list : undefined;
}

function toViewEvents(value: unknown): ListingViewEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((event): ListingViewEvent[] => {
    if (!isRecord(event)) return [];
    const viewedAt = toDateValue(event.viewedAt) ?? toDateValue(event.viewedAtDate) ?? new Date(0);
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
    _revision: typeof item._revision === "string" ? item._revision : undefined,
    _createdDate: toDateValue(item._createdDate),
    _updatedDate: toDateValue(item._updatedDate),
    title: toStringValue(item.title) ?? "Untitled listing",
    description: (() => { const value = toStringValue(item.description); return value ? normalizeRichText(value) : undefined; })(),
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
    panoramaImage: toStringValue(item.panoramaImage),
    panoramaImages: mergePanoramas(
      toGallery(item.panoramaImages),
      toStringValue(item.panoramaImage),
    ),
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

function toWixStreetAddress(
  line: string | undefined,
): { name: string; number?: number } | undefined {
  const trimmed = line?.trim() ?? "";
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d+)\s+(.+)$/);
  const numberPart = match?.[1];
  const namePart = match?.[2];
  if (numberPart && namePart) {
    return { number: Number(numberPart), name: namePart };
  }
  return { name: trimmed };
}

function toWixAddress(
  address: NonNullable<Listing["address"]>,
): Record<string, unknown> {
  const street = toWixStreetAddress(address.address ?? address.streetAddress);
  const state = address.state ?? address.subdivision;
  return {
    ...(address.country ? { country: address.country } : {}),
    ...(state ? { state, subdivision: state } : {}),
    ...(address.city ? { city: address.city } : {}),
    ...(address.formatted ? { formatted: address.formatted } : {}),
    ...(street ? { streetAddress: street } : {}),
  };
}

function withoutEmptyValues(input: ListingInput): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (key === "address" && value && typeof value === "object") {
      result.address = toWixAddress(value as NonNullable<Listing["address"]>);
      continue;
    }
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
    panoramaImage: listing.panoramaImage,
    panoramaImages: listing.panoramaImages,
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

function listingSearchFilter(search: string) {
  return items
    .filter()
    .contains("title", search)
    .or(items.filter().contains("city", search))
    .or(items.filter().contains("description", search));
}

export async function queryListings(
  queryOptions: ListingQuery = {},
): Promise<ListingPage> {
  const page = Math.max(0, queryOptions.page ?? 0);
  const pageSize = Math.min(100, Math.max(1, queryOptions.pageSize ?? 10));
  let query = items.query(LISTINGS_COLLECTION_ID);
  const search = queryOptions.search?.trim();

  if (search) query = query.and(listingSearchFilter(search));

  if (queryOptions.status) {
    query = query.eq("status", queryOptions.status);
  } else if (!queryOptions.includeArchived) {
    query = query.ne("status", "archived");
  }

  if (queryOptions.propertyType) query = query.eq("propertyType", queryOptions.propertyType);
  if (queryOptions.transactionType) query = query.eq("transactionType", queryOptions.transactionType);
  if (queryOptions.minPrice !== undefined) query = query.ge("price", queryOptions.minPrice);
  if (queryOptions.maxPrice !== undefined) query = query.le("price", queryOptions.maxPrice);
  if (queryOptions.minBedrooms !== undefined) query = query.ge("bedrooms", queryOptions.minBedrooms);

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
  const item = await auth.elevate(items.get)(LISTINGS_COLLECTION_ID, id);
  return item ? normalizeListing(item) : null;
}

export async function saveListing(
  input: ListingInput,
  id?: string,
  revision?: string,
): Promise<Listing> {
  const data = withoutEmptyValues(input);
  if (!id) {
    const owner = await getSiteOwnerContact();
    if (!data.agentEmail && owner.email) data.agentEmail = owner.email;
    if (!data.agentName && owner.name) data.agentName = owner.name;
    if (!data.agentPhone && owner.phone) data.agentPhone = owner.phone;
  }
  if (revision) data._revision = revision;
  const result = id
    ? await auth.elevate(items.update)(LISTINGS_COLLECTION_ID, { _id: id, ...data })
    : await items.insert(LISTINGS_COLLECTION_ID, data);

  return normalizeListing(result);
}

export async function updateListing(
  id: string,
  patch: Partial<ListingInput>,
): Promise<Listing | null> {
  const listing = await getListing(id);
  if (!listing) return null;

  return saveListing({ ...listingToInput(listing), ...patch }, id, listing._revision);
}

async function newestActiveListings(limit: number): Promise<Listing[]> {
  const result = await auth
    .elevate(items.query)(LISTINGS_COLLECTION_ID)
    .eq("status", "active")
    .descending("_updatedDate")
    .limit(limit)
    .find();
  return result.items.map(normalizeListing);
}

function matchesPublicFilters(
  listing: Listing,
  queryOptions: Pick<
    ListingQuery,
    | "search"
    | "transactionType"
    | "propertyType"
    | "minPrice"
    | "maxPrice"
    | "minBedrooms"
  >,
): boolean {
  const search = queryOptions.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      listing.title,
      listing.city,
      listing.description ?? "",
      listing.address?.formatted ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (
    queryOptions.transactionType &&
    listing.transactionType !== queryOptions.transactionType
  ) {
    return false;
  }
  if (
    queryOptions.propertyType &&
    listing.propertyType !== queryOptions.propertyType
  ) {
    return false;
  }
  if (
    queryOptions.minPrice !== undefined &&
    listing.price < queryOptions.minPrice
  ) {
    return false;
  }
  if (
    queryOptions.maxPrice !== undefined &&
    listing.price > queryOptions.maxPrice
  ) {
    return false;
  }
  if (
    queryOptions.minBedrooms !== undefined &&
    (listing.bedrooms ?? 0) < queryOptions.minBedrooms
  ) {
    return false;
  }
  return true;
}

function gatePublicItems(
  listings: Listing[],
  entitlement: AppEntitlement,
): Listing[] {
  return listings.map((listing) =>
    applyPublicListingGates(listing, entitlement),
  );
}

export async function getPublicPriceRange(): Promise<ListingPriceRange> {
  try {
    const entitlement = await getAppEntitlement();
    if (entitlement.listingCap !== null) {
      const listings = await newestActiveListings(entitlement.listingCap);
      const prices = listings.map((listing) => listing.price);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      return {
        minPrice,
        maxPrice: Math.max(minPrice, maxPrice),
        currency: listings[0]?.currency ?? "USD",
      };
    }
    const baseQuery = () =>
      auth.elevate(items.query)(LISTINGS_COLLECTION_ID).eq("status", "active");
    const [lowest, highest] = await Promise.all([
      baseQuery().ascending("price").limit(1).find(),
      baseQuery().descending("price").limit(1).find(),
    ]);
    const cheapest = lowest.items[0]
      ? normalizeListing(lowest.items[0])
      : undefined;
    const priciest = highest.items[0]
      ? normalizeListing(highest.items[0])
      : undefined;
    const minPrice = cheapest?.price ?? 0;
    const maxPrice = priciest?.price ?? 0;
    return {
      minPrice,
      maxPrice: Math.max(minPrice, maxPrice),
      currency: priciest?.currency ?? cheapest?.currency ?? "USD",
    };
  } catch (error) {
    console.error("Unable to load public listing price range.", error);
    return { minPrice: 0, maxPrice: 1_000_000, currency: "USD" };
  }
}

export async function queryPublicListings(
  queryOptions: Pick<
    ListingQuery,
    | "search"
    | "transactionType"
    | "propertyType"
    | "minPrice"
    | "maxPrice"
    | "minBedrooms"
    | "page"
    | "pageSize"
  > = {},
): Promise<ListingPage> {
  const page = Math.max(0, queryOptions.page ?? 0);
  const pageSize = Math.min(100, Math.max(1, queryOptions.pageSize ?? 12));
  const entitlement = await getAppEntitlement();

  if (entitlement.listingCap !== null) {
    const allowed = (await newestActiveListings(entitlement.listingCap)).filter(
      (listing) => matchesPublicFilters(listing, queryOptions),
    );
    const start = page * pageSize;
    const pageItems = allowed.slice(start, start + pageSize);
    return {
      items: gatePublicItems(pageItems, entitlement),
      totalCount: allowed.length,
      hasNext: start + pageSize < allowed.length,
    };
  }

  let query = auth
    .elevate(items.query)(LISTINGS_COLLECTION_ID)
    .eq("status", "active");
  const search = queryOptions.search?.trim();

  if (search) query = query.and(listingSearchFilter(search));
  if (queryOptions.transactionType)
    query = query.eq("transactionType", queryOptions.transactionType);
  if (queryOptions.propertyType)
    query = query.eq("propertyType", queryOptions.propertyType);
  if (queryOptions.minPrice !== undefined)
    query = query.ge("price", queryOptions.minPrice);
  if (queryOptions.maxPrice !== undefined)
    query = query.le("price", queryOptions.maxPrice);
  if (queryOptions.minBedrooms !== undefined)
    query = query.ge("bedrooms", queryOptions.minBedrooms);

  const result = await query
    .descending("_updatedDate")
    .skip(page * pageSize)
    .limit(pageSize)
    .find({ returnTotalCount: true });
  return {
    items: gatePublicItems(result.items.map(normalizeListing), entitlement),
    totalCount: result.totalCount ?? result.items.length,
    hasNext: result.hasNext(),
  };
}

export async function getVisibleActiveListing(id: string): Promise<Listing | null> {
  const listing = await getListing(id);
  if (!listing || listing.status !== "active") return null;

  const entitlement = await getAppEntitlement();
  if (entitlement.listingCap !== null) {
    const allowed = await newestActiveListings(entitlement.listingCap);
    if (!allowed.some((item) => item._id === id)) return null;
  }

  return listing;
}

export async function getPublicListing(id: string): Promise<Listing | null> {
  const listing = await getVisibleActiveListing(id);
  if (!listing) return null;
  return applyPublicListingGates(listing, await getAppEntitlement());
}

export async function recordListingView(
  id: string,
  viewEvent: ListingViewEvent,
): Promise<Listing | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const listing = await getVisibleActiveListing(id);
    if (!listing) return null;

    try {
      return await updateListing(id, {
        viewCount: (listing.viewCount ?? 0) + 1,
        viewEvents: [...(listing.viewEvents ?? []), viewEvent],
      });
    } catch (error) {
      if (attempt === 2) throw error;
      console.warn("Retrying concurrent listing view update.", { id, attempt });
    }
  }

  return null;
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
