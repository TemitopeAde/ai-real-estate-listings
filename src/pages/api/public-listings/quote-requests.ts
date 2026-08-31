import type { APIRoute } from 'astro';
import { createQuoteRequest } from '@/lib/server/quote-requests';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, unknown>;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const result = await createQuoteRequest(body, `ip:${ip}:${String(body.email ?? '').trim().toLowerCase()}`);
    return json({ success: true, requestId: result._id }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The quote request could not be submitted.';
    const status = /required|valid|recently|available|wait/i.test(message) ? 400 : 500;
    return json({ success: false, message }, status);
  }
};
