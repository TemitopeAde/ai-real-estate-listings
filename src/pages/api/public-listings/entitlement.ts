import type { APIRoute } from 'astro';
import { getBillingAccess, subscriptionError } from '@/lib/server/entitlement';

export const GET: APIRoute = async () => {
  const access = await getBillingAccess();
  return subscriptionError(access) ?? new Response(JSON.stringify({ hasAccess: true }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
