import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { ListingLimitError } from '@/lib/server/entitlement';
import { duplicateListing } from '@/lib/server/listings';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const handlePOST: APIRoute = async ({ params }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const id = params.id;
  if (!id) return json({ message: 'Listing ID is required.' }, 400);

  try {
    const listing = await duplicateListing(id);
    return listing ? json(listing, 201) : json({ message: 'Listing not found.' }, 404);
  } catch (error) {
    if (error instanceof ListingLimitError) {
      return json({
        message: error.message,
        code: error.code,
        planId: error.planId,
        listingCap: error.listingCap,
        listingCount: error.listingCount,
      }, error.status);
    }
    console.error('Unable to duplicate listing.', error);
    return json({ message: error instanceof Error ? error.message : 'The listing could not be duplicated.' }, 500);
  }
};

export const POST = withSubscription(handlePOST, true);
