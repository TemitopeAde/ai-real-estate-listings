import { httpClient } from '@wix/essentials';
import { pollWhileVisible } from './poll-while-visible';

export function observePublicAccess(onAccess: (allowed: boolean) => void): () => void {
  let active = true;
  const stop = pollWhileVisible(async (signal) => {
    let allowed = false;
    try {
      const response = await httpClient.fetchWithAuth(
        `${new URL(import.meta.url).origin}/api/public-listings/entitlement`,
        { signal, cache: 'no-store' },
      );
      if (response.ok) {
        const data = await response.json();
        allowed = data?.hasAccess === true;
      }
    } catch { /* Access stays closed until it can be verified again. */ }
    if (active) onAccess(allowed && !signal.aborted);
  });
  return () => { active = false; stop(); };
}
