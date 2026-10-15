import type { resolveBillingAccess } from './billing-access';

type SubscriptionEvent = {
  data?: { operationTimeStamp?: Date | null };
  metadata?: { instanceId?: string | null; eventType?: string };
};

/** Webhooks never assign access from their payload: old deliveries cannot revoke a new plan. */
export async function observeSubscriptionEvent(
  eventType: string,
  event: SubscriptionEvent,
  getAccess: () => Promise<ReturnType<typeof resolveBillingAccess>>,
  emit: (observation: Record<string, unknown>) => void,
) {
  const access = await getAccess();
  const instanceId = event.metadata?.instanceId;
  if (!instanceId || access.instanceId !== instanceId) {
    emit({ category: 'subscription_lifecycle', eventType, instanceId, status: 'instance_unverified' });
    throw new Error('Subscription event instance could not be verified.');
  }
  emit({
    category: 'subscription_lifecycle', eventType, instanceId,
    occurredAt: event.data?.operationTimeStamp?.toISOString() ?? null,
    observedAt: new Date().toISOString(),
    billingStatus: access.accessStatus,
    hasAccess: access.hasAccess,
    planId: access.planId,
    autoRenewing: access.autoRenewing,
  });
  if (access.accessStatus === 'unavailable') throw new Error('Billing could not be verified.');
}
