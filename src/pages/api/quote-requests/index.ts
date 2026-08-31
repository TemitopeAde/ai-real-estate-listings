import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { isQuoteRequestStatus, type QuoteRequestStatus } from '@/lib/quote-requests';
import { queryQuoteRequests } from '@/lib/server/quote-requests';

export const GET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') ?? 10) || 10));
  const search = url.searchParams.get('search')?.trim() ?? '';
  const rawStatus = url.searchParams.get('status');
  const requestStatus = isQuoteRequestStatus(rawStatus) ? rawStatus as QuoteRequestStatus : undefined;
  try { return new Response(JSON.stringify(await queryQuoteRequests(page, pageSize, search, requestStatus, url.searchParams.get('includeArchived') === 'true')), { headers: { 'Content-Type': 'application/json' } }); }
  catch (error) { console.error('Unable to query quote requests.', error); return new Response(JSON.stringify({ message: 'Quote requests are unavailable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
};
