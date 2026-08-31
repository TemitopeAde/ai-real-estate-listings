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
