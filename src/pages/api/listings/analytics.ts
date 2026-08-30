import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { getAnalyticsSnapshot } from '@/lib/server/listings';

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  try {
    return new Response(JSON.stringify(await getAnalyticsSnapshot()), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unable to calculate listing analytics.', error);
    return new Response(JSON.stringify({ message: 'The analytics service is unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
