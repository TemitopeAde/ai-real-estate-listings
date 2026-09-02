import type { APIRoute } from "astro";

import { isPropertyType, isTransactionType, type ListingViewEvent } from "@/lib/listing-types";
import { getPublicListing, getPublicPriceRange, queryPublicListings, recordListingView } from "@/lib/server/listings";
import { withPublicOwnerContact } from "@/lib/server/site-owner";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 256) : undefined;
}

function optionalNumber(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function pageParam(value: string | null, fallback: number, max: number): number {
  if (!value?.trim()) return fallback;
  const number = Number(value);
  return Number.isInteger(number) ? Math.min(max, Math.max(0, number)) : fallback;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get("id")?.trim();
    if (id) {
      const listing = await getPublicListing(id);
      return listing
        ? json(await withPublicOwnerContact(listing))
        : json({ message: "Listing not found." }, 404);
    }
    if (url.searchParams.get("priceRange") === "1") return json(await getPublicPriceRange());
    const transactionTypeParam = url.searchParams.get("transactionType") ?? "";
    const propertyTypeParam = url.searchParams.get("propertyType") ?? "";
    const page = pageParam(url.searchParams.get("page"), 0, 1000000);
    const pageSize = pageParam(url.searchParams.get("pageSize"), 12, 100);
    const result = await queryPublicListings({
      search: optionalText(url.searchParams.get("search")),
      transactionType: isTransactionType(transactionTypeParam) ? transactionTypeParam : undefined,
      propertyType: isPropertyType(propertyTypeParam) ? propertyTypeParam : undefined,
      minPrice: optionalNumber(url.searchParams.get("minPrice")),
      maxPrice: optionalNumber(url.searchParams.get("maxPrice")),
      minBedrooms: optionalNumber(url.searchParams.get("bedrooms")),
      page,
      pageSize,
    });
    return json({ ...result, page, pageSize }, 200);
  } catch (error) {
    console.error("Unable to load public listings.", error);
    return json({ message: "Listings are temporarily unavailable." }, 500);
  }
};

export const POST: APIRoute = async ({ request, url }) => {
  const id = url.searchParams.get("id")?.trim();
  if (!id) return json({ message: "Listing ID is required." }, 400);

  let body: unknown = {};
  try { body = await request.json(); } catch { /* Optional member data may be omitted. */ }
  const source = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const viewEvent: ListingViewEvent = {
    viewedAt: new Date(),
    viewerId: optionalText(source.viewerId),
    viewerName: optionalText(source.viewerName),
    viewerEmail: optionalText(source.viewerEmail),
  };

  try {
    const listing = await recordListingView(id, viewEvent);
    return listing ? json({ viewCount: listing.viewCount }) : json({ message: "Listing not found." }, 404);
  } catch (error) {
    console.error("Unable to record public listing view.", error);
    return json({ message: "The listing view could not be recorded." }, 500);
  }
};
