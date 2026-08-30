import { httpClient } from "@wix/essentials";

export {
  AREA_UNITS,
  PROPERTY_CONDITIONS,
  FURNISHING_STATUSES,
  TENURE_TYPES,
  RENTAL_FREQUENCIES,
  LISTINGS_COLLECTION_ID,
  LISTING_STATUSES,
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  getAreaUnit,
  getListingStatus,
  getPropertyType,
  getTransactionType,
  isAreaUnit,
  isListingStatus,
  isPropertyType,
  isTransactionType,
  isPropertyCondition,
  isFurnishingStatus,
  isTenureType,
  isRentalFrequency,
} from "./listing-types";
export type {
  AnalyticsSnapshot,
  AreaUnit,
  PropertyCondition,
  FurnishingStatus,
  TenureType,
  RentalFrequency,
  DashboardSnapshot,
  Listing,
  ListingInput,
  ListingImage,
  ListingViewEvent,
  ListingPage,
  ListingQuery,
  ListingStatus,
  PropertyType,
  TransactionType,
} from "./listing-types";
import type {
  AnalyticsSnapshot,
  DashboardSnapshot,
  Listing,
  ListingInput,
  ListingPage,
  ListingQuery,
} from "./listing-types";

class ListingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ListingsApiError";
  }
}

function getApiOrigin(): string {
  return new URL(import.meta.url).origin;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await httpClient.fetchWithAuth(`${getApiOrigin()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    { message?: string } | T | null;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "The listings request failed.";
    throw new ListingsApiError(message, response.status);
  }

  return payload as T;
}

function deserializeListing(listing: Listing): Listing {
  return {
    ...listing,
    _createdDate: listing._createdDate
      ? new Date(listing._createdDate)
      : undefined,
    _updatedDate: listing._updatedDate
      ? new Date(listing._updatedDate)
      : undefined,
    availabilityDate: listing.availabilityDate
      ? new Date(listing.availabilityDate)
      : undefined,
    aiGeneratedAt: listing.aiGeneratedAt
      ? new Date(listing.aiGeneratedAt)
      : undefined,
  };
}

function deserializePage(page: ListingPage): ListingPage {
  return { ...page, items: page.items.map(deserializeListing) };
}

function encodeQuery(queryOptions: ListingQuery): string {
  const params = new URLSearchParams();

  if (queryOptions.search?.trim())
    params.set("search", queryOptions.search.trim());
  if (queryOptions.status) params.set("status", queryOptions.status);
  if (queryOptions.propertyType)
    params.set("propertyType", queryOptions.propertyType);
  if (queryOptions.includeArchived !== undefined) {
    params.set("includeArchived", String(queryOptions.includeArchived));
  }
  if (queryOptions.page !== undefined)
    params.set("page", String(queryOptions.page));
  if (queryOptions.pageSize !== undefined)
    params.set("pageSize", String(queryOptions.pageSize));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function queryListings(
  queryOptions: ListingQuery = {},
): Promise<ListingPage> {
  return deserializePage(
    await request<ListingPage>(`/api/listings${encodeQuery(queryOptions)}`),
  );
}

export async function getListing(id: string): Promise<Listing | null> {
  try {
    return deserializeListing(
      await request<Listing>(`/api/listings/${encodeURIComponent(id)}`),
    );
  } catch (error) {
    if (error instanceof ListingsApiError && error.status === 404) return null;
    throw error;
  }
}

export async function saveListing(
  input: ListingInput,
  id?: string,
): Promise<Listing> {
  const response = id
    ? await request<Listing>(`/api/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      })
    : await request<Listing>("/api/listings", {
        method: "POST",
        body: JSON.stringify(input),
      });

  return deserializeListing(response);
}

export async function archiveListing(id: string): Promise<Listing> {
  const response = await request<Listing>(
    `/api/listings/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "archived" }),
    },
  );
  return deserializeListing(response);
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const snapshot = await request<DashboardSnapshot>("/api/listings/overview");
  return { ...snapshot, recent: snapshot.recent.map(deserializeListing) };
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  return request<AnalyticsSnapshot>("/api/listings/analytics");
}
