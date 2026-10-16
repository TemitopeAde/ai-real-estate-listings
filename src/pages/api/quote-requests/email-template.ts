import { withSubscription } from "@/lib/server/subscription-route";
import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { getQuoteConfirmationTemplate, saveQuoteConfirmationTemplate } from '@/lib/server/email-templates';
import { validateQuoteConfirmationTemplate } from '@/lib/quote-email-template';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** The confirmation email sent to visitors who request a quote (editable by the site owner). */
const handleGET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  return json(await getQuoteConfirmationTemplate());
};

const handlePUT: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;
  let body: unknown;
  try { body = await request.json(); } catch { return json({ message: 'Request body must be valid JSON.' }, 400); }
  const parsed = validateQuoteConfirmationTemplate(body);
  if (!parsed.value) return json({ message: Object.values(parsed.errors).join(' '), errors: parsed.errors }, 422);
  try {
    return json(await saveQuoteConfirmationTemplate(parsed.value));
  } catch (error) {
    console.error('Unable to save the quote confirmation email template.', error);
    return json({ message: 'The email could not be saved. Please try again.' }, 500);
  }
};

export const GET = withSubscription(handleGET, true);
export const PUT = withSubscription(handlePUT, true);
