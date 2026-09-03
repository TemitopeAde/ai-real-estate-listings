import { appInstances } from "@wix/app-management";
import { items } from "@wix/data";
import { auth } from "@wix/essentials";

import {
  type AppEntitlement,
  type PublicListingAccess,
  canStartFreeTrial,
  listingCapForPlan,
  publicAccessFromFeatures,
  publicListingCount,
} from "@/lib/entitlement";
import { LISTINGS_COLLECTION_ID, type Listing } from "@/lib/listing-types";
import {
  featuresForPlan,
  isAppPlanId,
  type AppPlanId,
  type PlanFeatureFlag,
} from "@/lib/pricing-plans";

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function resolvePlanId(packageName: string | undefined): AppPlanId {
  const value = packageName?.toLowerCase() ?? "";
  return isAppPlanId(value) ? value : "basic";
}

async function countActiveListings(): Promise<number> {
  try {
    return await auth.elevate(items.query)(LISTINGS_COLLECTION_ID)
      .eq("status", "active")
      .count();
  } catch (error) {
    console.error("Unable to count active listings for entitlement.", error);
    return 0;
  }
}

export async function getAppEntitlement(): Promise<AppEntitlement> {
  let planId: AppPlanId = "basic";
  let packageName = "basic";
  let instanceId = "";
  let isTrial = false;
  let isWixStaff = false;

  try {
    const response = await auth.elevate(appInstances.getAppInstance)();
    const instance = record(response.instance);
    const billing = record(instance?.billing);
    const trial = record(billing?.freeTrialInfo);
    const trialStatus = text(trial?.status)?.toUpperCase();
    isTrial = trialStatus === "IN_PROGRESS";
    packageName = text(billing?.packageName)?.toLowerCase() ?? "basic";
    planId = resolvePlanId(packageName);
    instanceId = text(instance?.instanceId) ?? "";
    const ownerEmail = text(record(record(response.site)?.ownerInfo)?.email);
    isWixStaff = Boolean(ownerEmail?.toLowerCase().endsWith("@wix.com"));
  } catch (error) {
    console.error("Unable to resolve app billing entitlement.", error);
  }

  const fullAccess = isTrial || isWixStaff;
  const features = featuresForPlan(fullAccess ? "business" : planId);
  const listingCap = listingCapForPlan(planId, fullAccess);
  const activeListingCount = await countActiveListings();

  return {
    planId,
    packageName: isAppPlanId(packageName) ? packageName : "basic",
    instanceId,
    isTrial,
    isWixStaff,
    canStartTrial: canStartFreeTrial({
      isTrial,
      planId,
      isWixStaff,
      instanceId,
    }),
    fullAccess,
    listingCap,
    features,
    activeListingCount,
    publicListingCount: publicListingCount(activeListingCount, listingCap),
  };
}

export async function requireFeature(
  feature: PlanFeatureFlag,
  message: string,
): Promise<{ entitlement: AppEntitlement; error: Response | null }> {
  const entitlement = await getAppEntitlement();
  if (entitlement.features[feature]) {
    return { entitlement, error: null };
  }
  return {
    entitlement,
    error: json(
      {
        message,
        code: "upgrade_required",
        planId: entitlement.planId,
      },
      403,
    ),
  };
}

export function publicAccessFor(
  entitlement: AppEntitlement,
): PublicListingAccess {
  return publicAccessFromFeatures(entitlement.features);
}

export function applyPublicListingGates(
  listing: Listing,
  entitlement: AppEntitlement,
): Listing {
  const { viewEvents: _viewEvents, panoramaImage, panoramaImages, ...rest } =
    listing;
  const gated: Listing = { ...rest };

  if (!entitlement.features.virtualTour) {
    return gated;
  }

  const scenes = panoramaImages?.filter((image) => image.url.trim()) ?? [];
  const firstFallback = panoramaImage?.trim();
  const merged =
    firstFallback && !scenes.some((image) => image.url === firstFallback)
      ? [{ url: firstFallback }, ...scenes]
      : scenes;
  const visible = entitlement.features.multiSceneTour
    ? merged
    : merged.slice(0, 1);
  const first = visible[0];
  if (!first) return gated;

  gated.panoramaImages = visible;
  gated.panoramaImage = first.url;
  return gated;
}
