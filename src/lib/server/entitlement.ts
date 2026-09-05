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
import {
  LISTINGS_COLLECTION_ID,
  type Listing,
  type ListingInput,
} from "@/lib/listing-types";
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

async function countListings(status?: "active"): Promise<number> {
  try {
    const query = auth.elevate(items.query)(LISTINGS_COLLECTION_ID);
    return await (status ? query.eq("status", status) : query).count();
  } catch (error) {
    console.error("Unable to count listings for entitlement.", error);
    return 0;
  }
}

export async function getAppEntitlement(): Promise<AppEntitlement> {
  let planId: AppPlanId = "basic";
  let packageName = "basic";
  let instanceId = "";
  let isTrial = false;

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
  } catch (error) {
    console.error("Unable to resolve app billing entitlement.", error);
  }

  const fullAccess = isTrial;
  const features = featuresForPlan(fullAccess ? "business" : planId);
  const listingCap = listingCapForPlan(planId, fullAccess);
  const [listingCount, activeListingCount] = await Promise.all([
    countListings(),
    countListings("active"),
  ]);

  return {
    planId,
    packageName: isAppPlanId(packageName) ? packageName : "basic",
    instanceId,
    isTrial,
    canStartTrial: canStartFreeTrial({
      isTrial,
      planId,
      instanceId,
    }),
    fullAccess,
    listingCap,
    features,
    listingCount,
    activeListingCount,
    publicListingCount: publicListingCount(activeListingCount, listingCap),
  };
}

export class ListingLimitError extends Error {
  readonly code = "listing_cap_reached";
  readonly status = 403;

  constructor(
    readonly planId: AppPlanId,
    readonly listingCap: number,
    readonly listingCount: number,
  ) {
    super(
      `Your plan allows up to ${listingCap} listings. Upgrade to add more.`,
    );
    this.name = "ListingLimitError";
  }
}

export function assertCanCreateListing(entitlement: AppEntitlement): void {
  if (entitlement.listingCap === null) return;
  if (entitlement.listingCount < entitlement.listingCap) return;
  throw new ListingLimitError(
    entitlement.planId,
    entitlement.listingCap,
    entitlement.listingCount,
  );
}

export class ListingEditError extends Error {
  readonly code = "upgrade_required";
  readonly status = 403;

  constructor(readonly planId: AppPlanId) {
    super("Editing listings is available on Pro and Business.");
    this.name = "ListingEditError";
  }
}

export function isArchiveOnlyPatch(patch: Partial<ListingInput>): boolean {
  const keys = Object.keys(patch);
  return keys.length === 1 && patch.status === "archived";
}

export function isViewMetricsPatch(patch: Partial<ListingInput>): boolean {
  const keys = Object.keys(patch);
  return (
    keys.length > 0 &&
    keys.every((key) => key === "viewCount" || key === "viewEvents")
  );
}

export function assertCanEditListing(
  entitlement: AppEntitlement,
  patch: Partial<ListingInput>,
): void {
  if (entitlement.features.editListings) return;
  if (isArchiveOnlyPatch(patch) || isViewMetricsPatch(patch)) return;
  throw new ListingEditError(entitlement.planId);
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
