import type { AppEntitlement } from "../entitlement";
import {
  QUOTE_REQUEST_STATUSES,
  isListingStatus,
  isPropertyType,
  isTransactionType,
  type Listing,
  type ListingQuery,
  type QuoteRequest,
  type QuoteRequestStatus,
} from "../listing-types";
import type { PlanFeatureFlag } from "../pricing-plans";
import { generateListingDescription, isListingWriterStyle, ListingWriterError } from "./ai-writer";
import { getAppEntitlement, ListingEditError, ListingLimitError } from "./entitlement";
import { parseListingInput, parseListingPatch } from "./listing-validation";
import { getAnalyticsSnapshot, getDashboardSnapshot, getListing, queryListings, saveListing, updateListing } from "./listings";
import { queryQuoteRequests, updateQuoteRequest } from "./quote-requests";

type Payload = Record<string, unknown>;
type ToolResult = Record<string, unknown>;
type ToolHandler = (payload: Payload, entitlement: AppEntitlement) => Promise<ToolResult>;

/** Expected failures go back to Aria as data so it can explain them; thrown errors are dropped silently. */
function fail(message: string): ToolResult {
  return { ok: false, message };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: unknown): number | undefined {
  const parsed = typeof value === "string" && value.trim() ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : undefined;
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = optionalNumber(value);
  return parsed === undefined ? fallback : Math.min(max, Math.max(min, Math.floor(parsed)));
}

function plainText(html: string | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function isoDate(value: Date | undefined): string | undefined {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : undefined;
}

function listingSummary(listing: Listing): ToolResult {
  return {
    id: listing._id,
    title: listing.title,
    status: listing.status,
    propertyType: listing.propertyType,
    transactionType: listing.transactionType,
    price: listing.price,
    currency: listing.currency,
    city: listing.city,
    address: listing.address?.formatted,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    area: listing.area,
    areaUnit: listing.areaUnit,
    viewCount: listing.viewCount ?? 0,
    updatedDate: isoDate(listing._updatedDate),
  };
}

function listingDetails(listing: Listing): ToolResult {
  return {
    ...listingSummary(listing),
    description: plainText(listing.description),
    amenities: listing.amenities ?? [],
    yearBuilt: listing.yearBuilt,
    parkingSpaces: listing.parkingSpaces,
    propertyCondition: listing.propertyCondition,
    furnishingStatus: listing.furnishingStatus,
    tenure: listing.tenure,
    rentalFrequency: listing.rentalFrequency,
    availabilityDate: isoDate(listing.availabilityDate),
    serviceCharge: listing.serviceCharge,
    securityDeposit: listing.securityDeposit,
    agentName: listing.agentName,
    agentEmail: listing.agentEmail,
    agentPhone: listing.agentPhone,
    primaryImage: listing.primaryImage,
    imageCount: (listing.gallery?.length ?? 0) + (listing.primaryImage ? 1 : 0),
    hasVirtualTour: Boolean(listing.panoramaImage || listing.panoramaImages?.length),
    createdDate: isoDate(listing._createdDate),
  };
}

function quoteSummary(request: QuoteRequest): ToolResult {
  return {
    id: request._id,
    status: request.status,
    archived: request.archived,
    name: `${request.firstName} ${request.lastName}`.trim(),
    email: request.email,
    phone: request.phone,
    message: request.message,
    notes: request.notes,
    listingId: request.listingId,
    listingTitle: request.listingTitle,
    listingPrice: request.listingPrice,
    listingCurrency: request.listingCurrency,
    createdDate: isoDate(request._createdDate),
  };
}

function isQuoteStatus(value: unknown): value is QuoteRequestStatus {
  return QUOTE_REQUEST_STATUSES.some((option) => option.value === value);
}

function requireFeature(entitlement: AppEntitlement, feature: PlanFeatureFlag, label: string): ToolResult | null {
  return entitlement.features[feature] ? null : fail(`${label} is available on the Pro and Business plans. Upgrade the app to use it.`);
}

const searchListings: ToolHandler = async (payload) => {
  const query: ListingQuery = {
    search: text(payload.search) || undefined,
    page: clampInt(payload.page, 0, 0, 1000),
    pageSize: clampInt(payload.pageSize, 10, 1, 25),
    includeArchived: payload.includeArchived === true,
    minPrice: optionalNumber(payload.minPrice),
    maxPrice: optionalNumber(payload.maxPrice),
    minBedrooms: optionalNumber(payload.minBedrooms),
  };
  if (payload.status !== undefined && payload.status !== "") {
    if (!isListingStatus(payload.status)) return fail("Status must be draft, active, under_offer, sold, or archived.");
    query.status = payload.status;
  }
  if (payload.propertyType !== undefined && payload.propertyType !== "") {
    if (!isPropertyType(payload.propertyType)) return fail("Unknown property type.");
    query.propertyType = payload.propertyType;
  }
  if (payload.transactionType !== undefined && payload.transactionType !== "") {
    if (!isTransactionType(payload.transactionType)) return fail("Transaction type must be sale, rent, or lease.");
    query.transactionType = payload.transactionType;
  }
  const page = await queryListings(query);
  return { ok: true, totalCount: page.totalCount, hasNext: page.hasNext, page: query.page, listings: page.items.map(listingSummary) };
};

const getListingTool: ToolHandler = async (payload) => {
  const id = text(payload.listingId);
  if (!id) return fail("listingId is required. Use search-listings to find it.");
  const listing = await getListing(id);
  return listing ? { ok: true, listing: listingDetails(listing) } : fail("Listing not found.");
};

const createListing: ToolHandler = async (payload, entitlement) => {
  const parsed = parseListingInput({ status: "draft", ...payload });
  if (!parsed.value) return fail(parsed.errors.join(" "));
  const listing = await saveListing(parsed.value);
  return { ok: true, listing: listingSummary(listing), listingCap: entitlement.listingCap };
};

const updateListingTool: ToolHandler = async (payload) => {
  const id = text(payload.listingId);
  if (!id) return fail("listingId is required. Use search-listings to find it.");
  const changes = payload.changes && typeof payload.changes === "object" ? { ...(payload.changes as Payload) } : {};
  delete changes.viewCount;
  delete changes.viewEvents;
  const parsed = parseListingPatch(changes);
  if (!parsed.value || Object.keys(parsed.value).length === 0) {
    return fail(parsed.errors.join(" ") || "Provide at least one field to change.");
  }
  const listing = await updateListing(id, parsed.value);
  return listing ? { ok: true, listing: listingSummary(listing) } : fail("Listing not found.");
};

const portfolioSummary: ToolHandler = async (_payload, entitlement) => {
  const snapshot = await getDashboardSnapshot();
  return {
    ok: true,
    total: snapshot.total,
    active: snapshot.active,
    underOffer: snapshot.underOffer,
    sold: snapshot.sold,
    publiclyVisible: entitlement.publicListingCount,
    recentListings: snapshot.recent.map(listingSummary),
  };
};

const listingAnalytics: ToolHandler = async (_payload, entitlement) => {
  const denied = requireFeature(entitlement, "analytics", "Portfolio analytics");
  if (denied) return denied;
  return { ok: true, ...(await getAnalyticsSnapshot()) };
};

const listQuoteRequests: ToolHandler = async (payload) => {
  const status = payload.status;
  if (status !== undefined && status !== "" && !isQuoteStatus(status)) return fail("Status must be new, contacted, quoted, or closed.");
  const page = clampInt(payload.page, 0, 0, 1000);
  const result = await queryQuoteRequests(page, clampInt(payload.pageSize, 10, 1, 25), text(payload.search), isQuoteStatus(status) ? status : undefined, payload.includeArchived === true);
  return { ok: true, totalCount: result.totalCount, hasNext: result.hasNext, page, quoteRequests: result.items.map(quoteSummary) };
};

const updateQuoteRequestTool: ToolHandler = async (payload) => {
  const id = text(payload.quoteRequestId);
  if (!id) return fail("quoteRequestId is required. Use list-quote-requests to find it.");
  if (payload.status !== undefined && !isQuoteStatus(payload.status)) return fail("Status must be new, contacted, quoted, or closed.");
  const input: Payload = {};
  if (payload.status !== undefined) input.status = payload.status;
  if (typeof payload.notes === "string") input.notes = payload.notes;
  if (typeof payload.archived === "boolean") input.archived = payload.archived;
  try {
    return { ok: true, quoteRequest: quoteSummary(await updateQuoteRequest(id, input)) };
  } catch (error) {
    if (error instanceof Error && error.message === "Quote request not found.") return fail(error.message);
    throw error;
  }
};

const writeListingDescription: ToolHandler = async (payload, entitlement) => {
  const denied = requireFeature(entitlement, "aiWriter", "The AI Listing Writer");
  if (denied) return denied;
  const style = text(payload.style) || "professional";
  if (!isListingWriterStyle(style)) return fail("Style must be professional, luxury, short, seo, or social.");

  const id = text(payload.listingId);
  const listing = id ? await getListing(id) : null;
  if (id && !listing) return fail("Listing not found.");
  const location = text(payload.location) || (listing ? [listing.address?.formatted, listing.city].filter(Boolean).join(", ") : "");
  if (!location) return fail("Provide a listingId or a location for the property.");
  const facts = {
    location,
    bedrooms: text(payload.bedrooms) || (listing?.bedrooms !== undefined ? String(listing.bedrooms) : ""),
    bathrooms: text(payload.bathrooms) || (listing?.bathrooms !== undefined ? String(listing.bathrooms) : ""),
    propertyType: text(payload.propertyType) || listing?.propertyType || "",
    amenities: text(payload.amenities) || (listing?.amenities ?? []).join(", "),
    furnishing: text(payload.furnishing) || listing?.furnishingStatus || "",
    price: text(payload.price) || (listing ? `${listing.currency} ${listing.price}` : ""),
  };
  try {
    const description = await generateListingDescription(facts, style);
    return { ok: true, style, listingId: listing?._id, description, note: "Not saved yet. Call update-listing with changes.description to save it." };
  } catch (error) {
    if (error instanceof ListingWriterError) return fail(error.message);
    throw error;
  }
};

const planDetails: ToolHandler = async (_payload, entitlement) => ({
  ok: true,
  planId: entitlement.planId,
  accessStatus: entitlement.accessStatus,
  isTrial: entitlement.isTrial,
  canStartTrial: entitlement.canStartTrial,
  autoRenewing: entitlement.autoRenewing,
  listingCap: entitlement.listingCap ?? "unlimited",
  listingCount: entitlement.listingCount,
  activeListingCount: entitlement.activeListingCount,
  publiclyVisibleListings: entitlement.publicListingCount,
  features: entitlement.features,
});

const TOOL_HANDLERS: Record<string, ToolHandler> = {
  "search-listings": searchListings,
  "get-listing": getListingTool,
  "create-listing": createListing,
  "update-listing": updateListingTool,
  "get-portfolio-summary": portfolioSummary,
  "get-listing-analytics": listingAnalytics,
  "list-quote-requests": listQuoteRequests,
  "update-quote-request": updateQuoteRequestTool,
  "write-listing-description": writeListingDescription,
  "get-plan-details": planDetails,
};

export async function runAppTool(methodName: string, payload: Payload): Promise<ToolResult> {
  const handler = TOOL_HANDLERS[methodName];
  if (!handler) throw new Error(`Unknown tool: ${methodName}`);

  const entitlement = await getAppEntitlement();
  if (!entitlement.hasAccess) {
    return fail(entitlement.accessStatus === "unavailable"
      ? "The app could not verify its subscription right now. Please try again shortly."
      : "The app subscription is inactive. Restore a plan from the app's pricing page to continue.");
  }

  try {
    return await handler(payload, entitlement);
  } catch (error) {
    if (error instanceof ListingLimitError || error instanceof ListingEditError) return fail(error.message);
    console.error(`App tool ${methodName} failed.`, error);
    return fail("The listings service is unavailable right now. Please try again.");
  }
}
