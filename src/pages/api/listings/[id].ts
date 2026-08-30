import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { parseListingPatch } from '@/lib/server/listing-validation';
import { getListing, updateListing } from '@/lib/server/listings';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The listings service is unavailable.';
}

export const GET: APIRoute = async ({ params }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const id = params.id;
  if (!id) return json({ message: 'Listing ID is required.' }, 400);

  try {
    const listing = await getListing(id);
    return listing ? json(listing) : json({ message: 'Listing not found.' }, 404);
  } catch (error) {
    console.error('Unable to load listing.', error);
    return json({ message: errorMessage(error) }, 500);
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const id = params.id;
  if (!id) return json({ message: 'Listing ID is required.' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  const parsed = parseListingPatch(body);
  if (!parsed.value || Object.keys(parsed.value).length === 0) {
    return json({ message: parsed.errors.join(' ') || 'At least one listing field is required.' }, 422);
  }

  try {
    const listing = await updateListing(id, parsed.value);
    return listing ? json(listing) : json({ message: 'Listing not found.' }, 404);
  } catch (error) {
    console.error('Unable to update listing.', error);
    return json({ message: errorMessage(error) }, 500);
  }
};
