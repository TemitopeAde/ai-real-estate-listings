import { createSubscriptionGuard } from '@/lib/subscription-guard';
import { requireDashboardAccess } from './access';
import { getBillingAccess } from './entitlement';

/** Authenticate and check billing before any business endpoint reads or writes data. */
export const withSubscription = createSubscriptionGuard(getBillingAccess, requireDashboardAccess);
