import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { getDashboardSnapshot } from '@/lib/server/listings';

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  try {
    return new Response(JSON.stringify(await getDashboardSnapshot()), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unable to load listing overview.', error);
    return new Response(JSON.stringify({ message: 'The overview service is unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
