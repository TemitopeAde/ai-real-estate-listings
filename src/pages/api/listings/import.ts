import { withSubscription } from "@/lib/server/subscription-route";
import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { importListingRows, parseImportRequest } from '@/lib/server/listing-import';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const handlePOST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  const parsed = parseImportRequest(body);
  if (!parsed.value) return json({ message: parsed.error }, 422);

  try {
    return json({ results: await importListingRows(parsed.value) });
  } catch (error) {
    console.error('Unable to import listings.', error);
    return json({ message: error instanceof Error ? error.message : 'The listings service is unavailable.' }, 500);
  }
};

export const POST = withSubscription(handlePOST, true);
