import { httpClient } from '@wix/essentials';
import type { ContactOption } from './contact-option';

export * from './contact-option';

/** Site contacts whose first name, last name or email starts with `search` (recent contacts when empty). */
export async function searchContacts(search: string): Promise<ContactOption[]> {
  const response = await httpClient.fetchWithAuth(`${new URL(import.meta.url).origin}/api/contacts?search=${encodeURIComponent(search)}`, { cache: 'no-store' });
  const body = await response.json().catch(() => ({})) as { items?: ContactOption[]; message?: string };
  if (!response.ok) throw new Error(body.message || 'Contacts are unavailable.');
  return body.items ?? [];
}
