import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { createInvoiceFromRequest } from '@/lib/server/invoice-requests';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const POST: APIRoute = async ({ params, request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  const id = params.id?.trim();
  if (!id) return json({ message: 'Invoice request ID is required.' }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return json({ message: 'Request body must be an object.' }, 422);
  const values = body as Record<string, unknown>;
  const amount = typeof values.amount === 'number' ? values.amount : Number(values.amount);
  const issueDate = typeof values.issueDate === 'string' ? new Date(values.issueDate) : new Date();
  const dueDate = typeof values.dueDate === 'string' ? new Date(values.dueDate) : new Date(NaN);
  if (Number.isNaN(issueDate.getTime()) || Number.isNaN(dueDate.getTime())) return json({ message: 'Valid issue and due dates are required.' }, 422);

  try {
    return json(await createInvoiceFromRequest(id, amount, issueDate, dueDate), 201);
  } catch (error) {
    console.error('Unable to create invoice.', error);
    const message = error instanceof Error ? error.message : 'The invoice could not be created.';
    const status = /already been created|could not be found/.test(message) ? 409 : 422;
    return json({ message }, status);
  }
};
