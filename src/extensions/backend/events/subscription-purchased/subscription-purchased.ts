import { appInstances } from '@wix/app-management';
import {
  isFreeTrialInProgress,
  notifyLifecycleEvent,
} from '../../../../backend/notify-lifecycle-event';
import { runInBackground } from '../../../../backend/run-in-background';
import { logSubscriptionEvent } from '../../../../lib/server/subscription-events';

// Wix needs a fast acknowledgement; email and Sheets delivery finish after the response.
export default appInstances.onAppInstancePaidPlanPurchased((event) => {
  runInBackground('PaidPlanPurchased', () => logSubscriptionEvent('PaidPlanPurchased', event));
  runInBackground('PaidPlanPurchased email', async () => notifyLifecycleEvent({
    eventType: (await isFreeTrialInProgress()) ? 'FREE_TRIAL' : 'PAID_PLAN_PURCHASED',
    vendorProductId: event.data.vendorProductId,
    cycle: event.data.cycle,
    invoiceId: event.data.invoiceId,
    occurredAt: event.data.operationTimeStamp,
    instanceIdHint: event.metadata?.instanceId,
  }));
});
