import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { searchContacts } from '@/lib/server/contacts';

/** Site contacts for the dashboard's contact picker. `?search=` matches the start of a name or email. */
const handleGET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const search = url.searchParams.get('search')?.trim().slice(0, 100) ?? '';
  try {
    return new Response(JSON.stringify({ items: await searchContacts(search) }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unable to search contacts.', error);
    return new Response(JSON.stringify({ message: 'Contacts are unavailable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const GET = withSubscription(handleGET, true);
