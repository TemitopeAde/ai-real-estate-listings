export type AccessStatus = 'free' | 'trial' | 'paid' | 'inactive' | 'unavailable';

export interface BillingInstance {
  instanceId?: string;
  isFree?: boolean;
  freeTrialAvailable?: boolean;
  billing?: {
    packageName?: string;
    autoRenewing?: boolean | null;
    freeTrialInfo?: { status?: string };
  };
}

/** Wix is authoritative: cancellation and elapsed dates alone do not end access. */
export function resolveBillingAccess(instance?: BillingInstance) {
  const instanceId = instance?.instanceId ?? '';
  const packageName = instance?.billing?.packageName?.trim().toLowerCase() ?? '';
  const paidPlanId: 'basic' | 'pro' | 'business' = packageName === 'pro' || packageName === 'business' ? packageName : 'basic';
  let accessStatus: AccessStatus = 'unavailable';
  // Free installs run on the Basic plan; its listing cap and feature gates apply.
  if (instanceId && instance?.isFree === true) accessStatus = 'free';
  else if (instanceId && instance?.isFree === false && paidPlanId !== 'basic') {
    accessStatus = instance.billing?.freeTrialInfo?.status === 'IN_PROGRESS' ? 'trial' : 'paid';
  }
  const planId = accessStatus === 'free' ? 'basic' : paidPlanId;
  const hasAccess = accessStatus === 'free' || accessStatus === 'trial' || accessStatus === 'paid';
  return {
    instanceId, packageName, planId, accessStatus, hasAccess,
    isTrial: accessStatus === 'trial',
    canStartTrial: accessStatus === 'free' && instance?.freeTrialAvailable === true,
    autoRenewing: instance?.billing?.autoRenewing ?? null,
  };
}
