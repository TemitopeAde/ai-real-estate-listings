import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { isInvoiceFilter } from '@/lib/invoice-draft';
import { createAndSendInvoice, invoiceResponse, listInvoices } from '@/lib/server/invoices';

/** Lists invoices created by the app, read live from Wix. `?quoteRequestId=` limits to one quote request; `?cursor=` loads the next page. */
const handleGET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const rawFilter = url.searchParams.get('filter');
  return invoiceResponse(() => listInvoices({
    cursor: url.searchParams.get('cursor')?.trim() || undefined,
    pageSize: Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 20) || 20)),
    filter: isInvoiceFilter(rawFilter) ? rawFilter : 'all',
    search: url.searchParams.get('search')?.trim().slice(0, 100) ?? '',
    quoteRequestId: url.searchParams.get('quoteRequestId')?.trim() || undefined,
  }), 'Invoices are unavailable.');
};

/** Creates a draft invoice; with `send: true` also publishes it, emails it and creates its payment link. */
const handlePOST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  let body: unknown;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ message: 'Request body must be valid JSON.' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }
  return invoiceResponse(() => createAndSendInvoice(body), 'The invoice could not be created. Please try again.');
};

export const GET = withSubscription(handleGET, true);
export const POST = withSubscription(handlePOST, true);
