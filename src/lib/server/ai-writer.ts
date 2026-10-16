import { readDeepSeekApiKey } from '../../backend/deepseek-env-bridge';

export const LISTING_WRITER_STYLES = ['professional', 'luxury', 'short', 'seo', 'social'] as const;
export type ListingWriterStyle = (typeof LISTING_WRITER_STYLES)[number];

export interface ListingWriterFacts {
  location: string;
  bedrooms?: string;
  bathrooms?: string;
  propertyType?: string;
  amenities?: string;
  furnishing?: string;
  price?: string;
}

export class ListingWriterError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ListingWriterError';
  }
}

const STYLE_INSTRUCTIONS: Record<ListingWriterStyle, string> = {
  professional: 'Use a clear, trustworthy real-estate tone with a strong opening and concise paragraphs.',
  luxury: 'Use an elegant, aspirational tone focused on finishes, lifestyle, exclusivity, and value.',
  short: 'Write 2-3 punchy sentences suitable for a listing card.',
  seo: 'Write 2-3 keyword-aware paragraphs, naturally mentioning the location and property type without keyword stuffing.',
  social: 'Write an engaging caption with a hook, short paragraphs, and a tasteful call to action. Do not overuse emojis.',
};

export function isListingWriterStyle(value: unknown): value is ListingWriterStyle {
  return LISTING_WRITER_STYLES.some((style) => style === value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function generateListingDescription(facts: ListingWriterFacts, style: ListingWriterStyle): Promise<string> {
  const apiKey = readDeepSeekApiKey();
  if (!apiKey) throw new ListingWriterError('AI writing is not configured. Add DEEPSEEK_API_KEY to the site environment.', 503);

  const factText = [
    `${facts.bedrooms || 'Not specified'} bedrooms`,
    `${facts.bathrooms || 'Not specified'} bathrooms`,
    `location: ${facts.location}`,
    `property type: ${facts.propertyType || 'property'}`,
    `amenities: ${facts.amenities || 'Not specified'}`,
    `furnishing: ${facts.furnishing || 'Not specified'}`,
    `price: ${facts.price || 'Not specified'}`,
  ].join('; ');

  let response: Response;
  try {
    response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: 'You write accurate property marketing copy. Never invent features, measurements, views, or legal claims. Return only the finished copy, with no heading or quotation marks.' },
          { role: 'user', content: `Create a property description using these confirmed facts: ${factText}. ${STYLE_INSTRUCTIONS[style]}` },
        ],
      }),
    });
  } catch (error) {
    console.error('Unable to reach the AI listing writer.', error);
    throw new ListingWriterError('The AI writer is temporarily unavailable. Please try again.', 502);
  }
  const result = (await response.json().catch(() => null)) as { choices?: Array<{ message?: { content?: unknown } }>; error?: { message?: unknown } } | null;
  const description = text(result?.choices?.[0]?.message?.content);
  if (!response.ok || !description) {
    console.error('DeepSeek listing writer request failed.', result?.error ?? response.status);
    throw new ListingWriterError('The AI provider could not generate copy right now. Please try again.', 502);
  }
  return description;
}
