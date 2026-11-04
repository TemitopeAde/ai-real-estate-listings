import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { syncQuoteRequestContacts } from '@/lib/server/quote-requests';

/** Creates site contacts for quote requests that don't have one yet, one batch per call. */
const handlePOST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const body = await request.json().catch(() => ({})) as { skip?: unknown };
  const skip = typeof body.skip === 'number' && Number.isInteger(body.skip) && body.skip >= 0 ? body.skip : 0;
  try {
    return new Response(JSON.stringify(await syncQuoteRequestContacts(25, skip)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unable to sync quote request contacts.', error);
    return new Response(JSON.stringify({ message: 'Contacts could not be synced.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST = withSubscription(handlePOST, true);
