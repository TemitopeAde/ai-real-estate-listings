import { appInstances } from '@wix/app-management';
import { notifyLifecycleEvent } from '../../../../backend/notify-lifecycle-event';
import { runInBackground } from '../../../../backend/run-in-background';
import { logSubscriptionEvent } from '../../../../lib/server/subscription-events';

// Wix needs a fast acknowledgement; email and Sheets delivery finish after the response.
export default appInstances.onAppInstancePaidPlanChanged((event) => {
  runInBackground('PaidPlanChanged', () => logSubscriptionEvent('PaidPlanChanged', event));
  runInBackground('PaidPlanChanged email', () => notifyLifecycleEvent({
    eventType: 'PAID_PLAN_CHANGED',
    vendorProductId: event.data.vendorProductId,
    previousVendorProductId: event.data.previousVendorProductId,
    cycle: event.data.cycle,
    invoiceId: event.data.invoiceId,
    occurredAt: event.data.operationTimeStamp,
    instanceIdHint: event.metadata?.instanceId,
  }));
});
