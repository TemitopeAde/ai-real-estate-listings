import { withSubscription } from "@/lib/server/subscription-route";
import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { generateListingDescription, isListingWriterStyle, ListingWriterError } from '@/lib/server/ai-writer';
import { requireFeature } from '@/lib/server/entitlement';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

const handlePOST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const { error } = await requireFeature(
    "aiWriter",
    "AI Listing Writer is available on Pro and Business.",
  );
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  if (!body || typeof body !== 'object') return json({ message: 'Listing details are required.' }, 422);
  const data = body as Record<string, unknown>;
  const style = text(data.style);
  const location = text(data.location);
  if (!location) return json({ message: 'Add a location before generating a description.' }, 422);
  if (!isListingWriterStyle(style)) return json({ message: 'Choose a valid writing style.' }, 422);

  try {
    const description = await generateListingDescription({
      location,
      bedrooms: text(data.bedrooms),
      bathrooms: text(data.bathrooms),
      propertyType: text(data.propertyType),
      amenities: text(data.amenities),
      furnishing: text(data.furnishing),
      price: text(data.price),
    }, style);
    return json({ description });
  } catch (error) {
    if (error instanceof ListingWriterError) return json({ message: error.message }, error.status);
    console.error('Unable to generate a listing description.', error);
    return json({ message: 'The AI writer is temporarily unavailable. Please try again.' }, 502);
  }
};

export const POST = withSubscription(handlePOST, true);
