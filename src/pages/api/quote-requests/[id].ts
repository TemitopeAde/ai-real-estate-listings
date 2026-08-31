import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { updateQuoteRequest } from '@/lib/server/quote-requests';

export const PATCH: APIRoute = async ({ params, request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  if (!params.id) return new Response(JSON.stringify({ message: 'Request ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  try { return new Response(JSON.stringify(await updateQuoteRequest(params.id, await request.json() as Record<string, unknown>)), { headers: { 'Content-Type': 'application/json' } }); }
  catch (error) { return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Quote request could not be updated.' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }
};
