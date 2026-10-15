import { appInstances } from '@wix/app-management';
import { runInBackground } from '../../../../backend/run-in-background';
import { logSubscriptionEvent } from '../../../../lib/server/subscription-events';

export default appInstances.onAppInstancePaidPlanAutoRenewalCancelled((event) => {
  runInBackground('PaidPlanAutoRenewalCancelled', () => logSubscriptionEvent('PaidPlanAutoRenewalCancelled', event));
});
