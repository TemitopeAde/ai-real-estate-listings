import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { getPaymentLink, invoiceResponse } from '@/lib/server/invoices';

/** Creates an online payment (checkout) link for the invoice. */
const handlePOST: APIRoute = async ({ params }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  if (!params.id) return new Response(JSON.stringify({ message: 'Invoice ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const id = params.id;
  return invoiceResponse(() => getPaymentLink(id), 'The payment link could not be created.');
};

export const POST = withSubscription(handlePOST, true);
