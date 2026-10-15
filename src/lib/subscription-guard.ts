import type { APIRoute } from 'astro';
import type { AccessStatus } from './billing-access';

type Access = { hasAccess: boolean; accessStatus: AccessStatus };

export function subscriptionError(access: Access): Response | null {
  if (access.hasAccess) return null;
  const unavailable = access.accessStatus === 'unavailable';
  return new Response(JSON.stringify({
    code: unavailable ? 'entitlement_unavailable' : 'subscription_required',
    message: 'Listings are temporarily unavailable.',
  }), {
    status: unavailable ? 503 : 403,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function createSubscriptionGuard(
  getAccess: () => Promise<Access>,
  authenticate: () => Promise<Response | null>,
) {
  return (handler: APIRoute, dashboard = false): APIRoute => async (context) => {
    if (dashboard) {
      const denied = await authenticate();
      if (denied) return denied;
    }
    let access: Access;
    try { access = await getAccess(); }
    catch { access = { hasAccess: false, accessStatus: 'unavailable' }; }
    const denied = subscriptionError(access);
    if (denied) return denied;
    const response = await handler(context);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  };
}
