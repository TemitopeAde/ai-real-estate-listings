import type { APIRoute } from 'astro';

import { getCurrentMemberId, listSavedProperties, removeSavedProperty, saveProperty } from '@/lib/server/saved-properties';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 128) : undefined;
}

export const POST: APIRoute = async ({ request }) => {
  const memberId = await getCurrentMemberId();
  if (!memberId) return json({ message: 'A logged-in Wix member is required.' }, 401);

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed === 'object' && parsed !== null) body = parsed as Record<string, unknown>;
  } catch {
    return json({ message: 'A JSON request body is required.' }, 400);
  }

  const action = text(body.action);
  try {
    if (action === 'save') {
      const listingId = text(body.listingId);
      return listingId ? json(await saveProperty(memberId, listingId)) : json({ message: 'Listing ID is required.' }, 400);
    }
    if (action === 'list') {
      return json(await listSavedProperties(memberId, text(body.cursor), typeof body.limit === 'number' ? body.limit : 12));
    }
    if (action === 'remove') {
      const listingId = text(body.listingId);
      return listingId ? json(await removeSavedProperty(memberId, listingId)) : json({ message: 'Listing ID is required.' }, 400);
    }
    return json({ message: 'Unsupported saved-property action.' }, 400);
  } catch (error) {
    console.error('Saved-property request failed.', error);
    return json({ message: error instanceof Error ? error.message : 'Saved properties are temporarily unavailable.' }, 500);
  }
};
