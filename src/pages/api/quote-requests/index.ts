import { withSubscription } from "@/lib/server/subscription-route";
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { isQuoteRequestStatus, type QuoteRequestStatus } from '@/lib/quote-requests';
import { countQuoteRequests, queryQuoteRequests, type QuoteRequestView } from '@/lib/server/quote-requests';

const handleGET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') ?? 10) || 10));
  const search = url.searchParams.get('search')?.trim() ?? '';
  const rawStatus = url.searchParams.get('status');
  const requestStatus = isQuoteRequestStatus(rawStatus) ? rawStatus as QuoteRequestStatus : undefined;
  const rawView = url.searchParams.get('view');
  // `includeArchived=true` is the older spelling of view=all.
  const view: QuoteRequestView = rawView === 'archived' || rawView === 'all' ? rawView : url.searchParams.get('includeArchived') === 'true' ? 'all' : 'active';
  try {
    const [result, counts] = await Promise.all([
      queryQuoteRequests(page, pageSize, search, requestStatus, view),
      url.searchParams.get('counts') === '1' ? countQuoteRequests() : Promise.resolve(undefined),
    ]);
    return new Response(JSON.stringify(counts ? { ...result, counts } : result), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  catch (error) { console.error('Unable to query quote requests.', error); return new Response(JSON.stringify({ message: 'Quote requests are unavailable.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
};

export const GET = withSubscription(handleGET, true);
