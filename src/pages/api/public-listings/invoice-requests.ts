import type { APIRoute } from 'astro';

import { createInvoiceRequest } from '@/lib/server/invoice-requests';
import type { InvoiceRequestInput } from '@/lib/listing-types';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return json({ message: 'Request body must be an object.' }, 422);
  }

  try {
    return json(await createInvoiceRequest(body as InvoiceRequestInput), 201);
  } catch (error) {
    console.error('Unable to create invoice request.', error);
    return json({ message: error instanceof Error ? error.message : 'The invoice request could not be created.' }, 422);
  }
};
