import { httpClient } from '@wix/essentials';

export type ListingCopyStyle = 'professional' | 'luxury' | 'short' | 'seo' | 'social';

export interface ListingCopyInput {
  bedrooms: string;
  bathrooms: string;
  location: string;
  amenities: string;
  furnishing: string;
  price: string;
  propertyType: string;
  style: ListingCopyStyle;
}

export const LISTING_COPY_STYLES: Array<{ value: ListingCopyStyle; label: string; description: string }> = [
  { value: 'professional', label: 'Professional', description: 'Clear and trustworthy' },
  { value: 'luxury', label: 'Luxury', description: 'Elevated and aspirational' },
  { value: 'short', label: 'Short', description: 'Perfect for cards' },
  { value: 'seo', label: 'SEO optimized', description: 'Search-friendly copy' },
  { value: 'social', label: 'Social media', description: 'Engaging and shareable' },
];

export const DEFAULT_LISTING_COPY_INPUT: ListingCopyInput = {
  bedrooms: '3',
  bathrooms: '2',
  location: 'Austin, Texas',
  amenities: 'Swimming pool',
  furnishing: 'Furnished',
  price: '$875,000',
  propertyType: 'Apartment',
  style: 'professional',
};

export function htmlFromPlainDescription(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const blocks = escaped
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (!blocks.length) return '';
  return blocks.map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`).join('');
}

export async function generateListingDescription(input: ListingCopyInput): Promise<string> {
  const response = await httpClient.fetchWithAuth(`${new URL(import.meta.url).origin}/api/ai/listing-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as { description?: string; message?: string } | null;
  if (!response.ok || !payload?.description) {
    throw new Error(payload?.message ?? 'The AI writer could not generate a description.');
  }
  return payload.description;
}
