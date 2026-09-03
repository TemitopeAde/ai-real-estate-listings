import {
  APP_PLAN_LISTING_CAPS,
  featuresForPlan,
  type AppPlanId,
  type PlanFeatureFlags,
} from "./pricing-plans";

export type { AppPlanId, PlanFeatureFlag, PlanFeatureFlags } from "./pricing-plans";
export {
  LOCKED_PUBLIC_ACCESS,
  publicAccessFromFeatures,
  type PublicListingAccess,
} from "./public-listing-access";

export interface AppEntitlement {
  planId: AppPlanId;
  packageName: string;
  instanceId: string;
  isTrial: boolean;
  isWixStaff: boolean;
  canStartTrial: boolean;
  fullAccess: boolean;
  listingCap: number | null;
  features: PlanFeatureFlags;
  activeListingCount: number;
  publicListingCount: number;
}

export function listingCapForPlan(
  planId: AppPlanId,
  fullAccess: boolean,
): number | null {
  return fullAccess ? null : APP_PLAN_LISTING_CAPS[planId];
}

export function publicListingCount(
  activeListingCount: number,
  listingCap: number | null,
): number {
  return listingCap === null
    ? activeListingCount
    : Math.min(activeListingCount, listingCap);
}

export const APP_ID = "c00de2bd-7278-4471-8292-52e8b7a7158c";

export function appUpgradeUrl(instanceId: string): string {
  return `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${encodeURIComponent(instanceId)}`;
}

export function openAppUpgradePage(instanceId: string): void {
  window.open(appUpgradeUrl(instanceId), "_blank", "noopener,noreferrer");
}

export function canStartFreeTrial(options: {
  isTrial: boolean;
  planId: AppPlanId;
  isWixStaff: boolean;
  instanceId: string;
}): boolean {
  if (options.isTrial || !options.instanceId) return false;
  return options.planId === "basic" || options.isWixStaff;
}

export { featuresForPlan, APP_PLAN_LISTING_CAPS };
