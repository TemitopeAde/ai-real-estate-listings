import type { APIRoute } from 'astro';

import { requireDashboardAccess } from '@/lib/server/access';
import { requireFeature } from '@/lib/server/entitlement';
import { getAnalyticsSnapshot } from '@/lib/server/listings';

export const GET: APIRoute = async () => {
  const accessError = await requireDashboardAccess();
  if (accessError) return accessError;

  const { error } = await requireFeature(
    "analytics",
    "Portfolio analytics is available on Pro and Business.",
  );
  if (error) return error;

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
