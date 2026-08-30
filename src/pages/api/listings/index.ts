import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { parseListingInput } from '@/lib/server/listing-validation';
import { queryListings, saveListing } from '@/lib/server/listings';
import {
  isListingStatus,
  isPropertyType,
  type ListingQuery,
} from '@/lib/listing-types';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function numberParam(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The listings service is unavailable.';
}

export const GET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const statusParam = url.searchParams.get('status');
  const propertyTypeParam = url.searchParams.get('propertyType');
  const query: ListingQuery = {
    search: url.searchParams.get('search') ?? undefined,
    page: numberParam(url.searchParams.get('page'), 0),
    pageSize: numberParam(url.searchParams.get('pageSize'), 10),
    includeArchived: url.searchParams.get('includeArchived') === 'true',
  };

  if (statusParam && !isListingStatus(statusParam)) return json({ message: 'Invalid status filter.' }, 400);
  if (propertyTypeParam && !isPropertyType(propertyTypeParam)) return json({ message: 'Invalid property type filter.' }, 400);
  if (isListingStatus(statusParam)) query.status = statusParam;
  if (isPropertyType(propertyTypeParam)) query.propertyType = propertyTypeParam;

  try {
    return json(await queryListings(query));
  } catch (error) {
    console.error('Unable to query listings.', error);
    return json({ message: errorMessage(error) }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  const parsed = parseListingInput(body);
  if (!parsed.value) return json({ message: parsed.errors.join(' ') }, 422);

  try {
    return json(await saveListing(parsed.value), 201);
  } catch (error) {
    console.error('Unable to create listing.', error);
    return json({ message: errorMessage(error) }, 500);
  }
};
