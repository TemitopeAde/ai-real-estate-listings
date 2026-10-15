import { appInstances } from '@wix/app-management';
import { runInBackground } from '../../../../backend/run-in-background';
import { logSubscriptionEvent } from '../../../../lib/server/subscription-events';

export default appInstances.onAppInstancePlanConvertedToPaid((event) => {
  runInBackground('PlanConvertedToPaid', () => logSubscriptionEvent('PlanConvertedToPaid', event));
});
