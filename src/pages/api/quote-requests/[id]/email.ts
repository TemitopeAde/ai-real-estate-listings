import { withSubscription } from "@/lib/server/subscription-route";
import type { APIRoute } from 'astro';
import { requireDashboardAccess } from '@/lib/server/access';
import { QuoteReplyError, sendQuoteReply } from '@/lib/server/quote-requests';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Sends an email from the site owner to the person who made this quote request. */
const handlePOST: APIRoute = async ({ params, request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  if (!params.id) return json({ message: 'Request ID is required.' }, 400);
  let body: unknown;
  try { body = await request.json(); } catch { return json({ message: 'Request body must be valid JSON.' }, 400); }
  try {
    return json(await sendQuoteReply(params.id, typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}));
  } catch (error) {
    if (error instanceof QuoteReplyError) return json({ message: error.message, code: error.code }, error.status);
    console.error('Unable to email the quote requester.', error);
    return json({ message: 'The email could not be sent. Please try again.' }, 500);
  }
};

export const POST = withSubscription(handlePOST, true);
