import type { APIRoute } from "astro";

import type { ListingViewEvent } from "@/lib/listing-types";
import { getPublicListing, queryPublicListings, recordListingView } from "@/lib/server/listings";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 256) : undefined;
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const id = url.searchParams.get("id")?.trim();
    if (id) {
      const listing = await getPublicListing(id);
      return listing ? json(listing) : json({ message: "Listing not found." }, 404);
    }
    return json(await queryPublicListings(), 200);
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
