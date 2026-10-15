import { getBillingAccess } from './billing-access';
import { observeSubscriptionEvent } from '../subscription-observation';
import { recordLifecycleEvent } from '../../backend/record-lifecycle-event';

export async function logSubscriptionEvent(
  eventType: string,
  event: Parameters<typeof observeSubscriptionEvent>[1],
) {
  // Runs after the webhook is acknowledged, so failures are logged rather than retried.
  const results = await Promise.allSettled([
    recordLifecycleEvent(eventType, event),
    observeSubscriptionEvent(eventType, event, getBillingAccess,
      (observation) => console.info(JSON.stringify(observation))),
  ]);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error(`[AI Real Estate Listings] ${eventType} logging failed`,
        result.reason instanceof Error ? result.reason.message : 'Unknown error');
    }
  }
}
