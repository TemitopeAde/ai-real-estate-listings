import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { queryInvoiceRequests } from '@/lib/server/invoice-requests';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  try {
    return json(await queryInvoiceRequests());
  } catch (error) {
    console.error('Unable to query invoice requests.', error);
    return json({ message: 'Invoice requests are unavailable.' }, 500);
  }
};
