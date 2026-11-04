import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { getInvoice, invoiceResponse } from '@/lib/server/invoices';

/** Returns the invoice as Wix has it now. */
const handleGET: APIRoute = async ({ params }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  if (!params.id) return new Response(JSON.stringify({ message: 'Invoice ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const id = params.id;
  return invoiceResponse(() => getInvoice(id), 'The invoice could not be loaded.');
};

export const GET = withSubscription(handleGET, true);
