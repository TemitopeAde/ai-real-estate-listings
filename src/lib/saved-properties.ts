import { httpClient } from '@wix/essentials';

export async function embedSavedPropertiesLauncher(): Promise<void> {
  const response = await httpClient.fetchWithAuth(
    `${new URL(import.meta.url).origin}/api/saved-properties/embed`,
    { method: 'POST', headers: { Accept: 'application/json' } },
  );
  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? 'The launcher could not be embedded.');
  }
}
