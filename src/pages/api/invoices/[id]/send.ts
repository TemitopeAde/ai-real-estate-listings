import { withSubscription } from '@/lib/server/subscription-route';
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { invoiceResponse, resendInvoice } from '@/lib/server/invoices';

/** Emails the invoice to the customer again (publishing it first if it's still a draft). */
const handlePOST: APIRoute = async ({ params, request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  if (!params.id) return new Response(JSON.stringify({ message: 'Invoice ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const id = params.id;
  const body = await request.json().catch(() => ({})) as { message?: unknown };
  return invoiceResponse(() => resendInvoice(id, body?.message), 'The invoice could not be sent.');
};

export const POST = withSubscription(handlePOST, true);
