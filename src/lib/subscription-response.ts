/**
 * Public listing APIs are guarded server-side (withSubscription): 403 means the site has no
 * active plan, 503 means billing couldn't be verified right now. Data requests double as the
 * access check, so the site never needs a separate entitlement call.
 */
export class SubscriptionLockedError extends Error {
  constructor() { super('subscription-locked'); this.name = 'SubscriptionLockedError'; }
}

export class AccessUnverifiedError extends Error {
  constructor() { super('access-unverified'); this.name = 'AccessUnverifiedError'; }
}

export function assertSubscriptionAccess(response: Response): void {
  if (response.status === 403) throw new SubscriptionLockedError();
  if (response.status === 503) throw new AccessUnverifiedError();
}

export const ACCESS_RETRY_MS = 5000;
