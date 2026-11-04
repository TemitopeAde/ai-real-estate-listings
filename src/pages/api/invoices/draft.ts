import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { getInvoiceDraftForQuote, invoiceResponse } from '@/lib/server/invoices';

/** A pre-filled invoice draft for a quote request (customer, currency, line items from the listing). */
const handleGET: APIRoute = async ({ url }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const quoteRequestId = url.searchParams.get('quoteRequestId')?.trim();
  if (!quoteRequestId) return new Response(JSON.stringify({ message: 'quoteRequestId is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  return invoiceResponse(() => getInvoiceDraftForQuote(quoteRequestId), 'The invoice draft could not be prepared.');
};

export const GET = withSubscription(handleGET, true);
