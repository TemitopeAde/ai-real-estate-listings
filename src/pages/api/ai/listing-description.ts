import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';

const STYLES = new Set(['professional', 'luxury', 'short', 'seo', 'social']);

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export const POST: APIRoute = async ({ request }) => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Request body must be valid JSON.' }, 400);
  }

  if (!body || typeof body !== 'object') return json({ message: 'Listing details are required.' }, 422);
  const data = body as Record<string, unknown>;
  const style = text(data.style);
  const location = text(data.location);
  if (!location) return json({ message: 'Add a location before generating a description.' }, 422);
  if (!STYLES.has(style)) return json({ message: 'Choose a valid writing style.' }, 422);

  const apiKey = import.meta.env.DEEPSEEK_API_KEY;
  if (!apiKey) return json({ message: 'AI writing is not configured. Add DEEPSEEK_API_KEY to the site environment.' }, 503);

  const facts = [
    `${text(data.bedrooms, 'Not specified')} bedrooms`,
    `${text(data.bathrooms, 'Not specified')} bathrooms`,
    `location: ${location}`,
    `property type: ${text(data.propertyType, 'property')}`,
    `amenities: ${text(data.amenities, 'Not specified')}`,
    `furnishing: ${text(data.furnishing, 'Not specified')}`,
    `price: ${text(data.price, 'Not specified')}`,
  ].join('; ');

  const styleInstructions: Record<string, string> = {
    professional: 'Use a clear, trustworthy real-estate tone with a strong opening and concise paragraphs.',
    luxury: 'Use an elegant, aspirational tone focused on finishes, lifestyle, exclusivity, and value.',
    short: 'Write 2-3 punchy sentences suitable for a listing card.',
    seo: 'Write 2-3 keyword-aware paragraphs, naturally mentioning the location and property type without keyword stuffing.',
    social: 'Write an engaging caption with a hook, short paragraphs, and a tasteful call to action. Do not overuse emojis.',
  };

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You write accurate property marketing copy. Never invent features, measurements, views, or legal claims. Return only the finished copy, with no heading or quotation marks.' },
          { role: 'user', content: `Create a property description using these confirmed facts: ${facts}. ${styleInstructions[style]}` },
        ],
      }),
    });
    const result = (await response.json().catch(() => null)) as { choices?: Array<{ message?: { content?: unknown } }>; error?: { message?: unknown } } | null;
    const description = text(result?.choices?.[0]?.message?.content);
    if (!response.ok || !description) {
      console.error('DeepSeek listing writer request failed.', result?.error ?? response.status);
      return json({ message: 'The AI provider could not generate copy right now. Please try again.' }, 502);
    }
    return json({ description });
  } catch (error) {
    console.error('Unable to reach the AI listing writer.', error);
    return json({ message: 'The AI writer is temporarily unavailable. Please try again.' }, 502);
  }
};
